// Test environment shims, loaded via the `setupFiles` option on the unit-test
// target in angular.json.
//
// Every gap patched here is jsdom's, not the application's — a real browser
// provides all of it. Nothing below changes app behaviour, and none of it
// should grow into stubbing out application code.
import { registerLocaleData } from '@angular/common';
import localeSr from '@angular/common/locales/sr-Latn';

// LocalizedDatePipe formats Serbian dates as 'sr-Latn'. app.config.ts registers
// this data at bootstrap, but specs instantiate the pipe directly and never
// import app.config, so the pipe would fail with NG0701 instead.
registerLocaleData(localeSr);

// The DOM lib types insist both globals below always exist, so a presence check
// narrows `window` to `never` and the assignment stops compiling. Going through
// a widened view states the disagreement once, instead of at each assignment.
const browserGlobals = window as unknown as Record<string, unknown>;

{
  // theme.service.ts only reads `.matches`, but book-table.ts also subscribes to
  // 'change' and removes the listener on destroy — so this has to be a real
  // EventTarget, not an object literal with no-op listener methods.
  class TestMediaQueryList extends EventTarget implements MediaQueryList {
    readonly matches = false;
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;

    constructor(readonly media: string) {
      super();
    }

    // Deprecated predecessors of add/removeEventListener, still on the
    // interface and still called by some libraries.
    addListener(): void {}
    removeListener(): void {}
  }

  if (typeof browserGlobals['matchMedia'] !== 'function') {
    browserGlobals['matchMedia'] = (query: string): MediaQueryList =>
      new TestMediaQueryList(query);
  }
}

{
  // jsdom ships TouchEvent but not the Touch constructor that populates it, so
  // book-table's swipe specs cannot build a touch point without this.
  class TestTouch implements Touch {
    readonly identifier: number;
    readonly target: EventTarget;
    readonly clientX: number;
    readonly clientY: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly pageX: number;
    readonly pageY: number;
    readonly radiusX: number;
    readonly radiusY: number;
    readonly rotationAngle: number;
    readonly force: number;

    constructor(init: TouchInit) {
      this.identifier = init.identifier;
      this.target = init.target;
      this.clientX = init.clientX ?? 0;
      this.clientY = init.clientY ?? 0;
      // The real constructor defaults screen/page coordinates to the client
      // ones rather than to zero; swipe maths reads clientX, but keep the
      // relationship honest for anything that reaches for the others.
      this.screenX = init.screenX ?? this.clientX;
      this.screenY = init.screenY ?? this.clientY;
      this.pageX = init.pageX ?? this.clientX;
      this.pageY = init.pageY ?? this.clientY;
      this.radiusX = init.radiusX ?? 0;
      this.radiusY = init.radiusY ?? 0;
      this.rotationAngle = init.rotationAngle ?? 0;
      this.force = init.force ?? 0;
    }
  }

  if (typeof browserGlobals['Touch'] !== 'function') {
    browserGlobals['Touch'] = TestTouch;
  }
}
