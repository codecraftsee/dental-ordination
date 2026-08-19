import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(obj: unknown, transformer: (key: string) => string): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[transformer(key)] = transformKeys(value, transformer);
  }
  return result;
}

/**
 * Deep snake_case → camelCase rename, exported for the one payload that cannot go
 * through the interceptor: the SSE import stream reads its body with `fetch`, so
 * HttpClient never sees it.
 */
export function snakeToCamelKeys(obj: unknown): unknown {
  return transformKeys(obj, snakeToCamel);
}

export const caseTransformInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Transform outgoing request body: camelCase → snake_case
  if (req.body && typeof req.body === 'object' && !(req.body instanceof FormData)) {
    req = req.clone({
      body: transformKeys(req.body, camelToSnake),
    });
  }

  // Transform outgoing query params the same way. The API names every query param
  // in snake_case, and camelToSnake leaves an already-snake_case key alone, so this
  // is safe to apply to every request.
  if (req.params.keys().length > 0) {
    let params = req.params;
    for (const key of req.params.keys()) {
      const snakeKey = camelToSnake(key);
      if (snakeKey === key) continue;
      params = params.delete(key);
      for (const value of req.params.getAll(key) ?? []) {
        params = params.append(snakeKey, value);
      }
    }
    req = req.clone({ params });
  }

  // Transform incoming response body: snake_case → camelCase
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({
          body: transformKeys(event.body, snakeToCamel),
        });
      }
      return event;
    }),
  );
};
