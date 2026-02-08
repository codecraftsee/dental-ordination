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

export const caseTransformInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Transform outgoing request body: camelCase → snake_case
  if (req.body && typeof req.body === 'object') {
    req = req.clone({
      body: transformKeys(req.body, camelToSnake),
    });
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
