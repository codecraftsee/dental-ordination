/**
 * Guards the matchMedia restore in test-setup.ts.
 *
 * The bug it prevents is invisible in a passing suite: a spec replaces
 * window.matchMedia with a partial stub, never restores it, and a later spec in
 * the same Vitest worker throws "mql.addListener is not a function" from CDK's
 * BreakpointObserver — as an unhandled error, so every test still reports green
 * while the run exits non-zero.
 *
 * Cross-file ordering cannot be pinned, so this asserts the invariant within one
 * file, where the order is guaranteed: whatever a test does to matchMedia, the
 * next one starts from a complete MediaQueryList again.
 */
describe('test-setup matchMedia shim', () => {
  it('provides the full MediaQueryList surface CDK expects', () => {
    const mql = window.matchMedia('(max-width: 767px)');
    expect(typeof mql.addListener).toBe('function');
    expect(typeof mql.removeListener).toBe('function');
    expect(typeof mql.addEventListener).toBe('function');
    expect(typeof mql.removeEventListener).toBe('function');
  });

  it('survives a spec replacing it with a partial stub', () => {
    // The shape that caused the CI failure. theme.service.spec.ts no longer
    // installs this, but the guard must hold for any spec that does.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    expect(window.matchMedia('(any)').addListener).toBeUndefined();
  });

  it('is restored for the next test in the file', () => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    expect(typeof mql.addListener).toBe('function');
  });
});
