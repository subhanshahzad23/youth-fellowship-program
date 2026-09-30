import type { Page } from "@playwright/test";

/** Open a page, wait for persisted state to hydrate and the test hook to exist. */
export async function openReady(page: Page, path = "/demo") {
  await page.goto(path);
  await page.waitForFunction(() => {
    const w = window as unknown as { __launchpad?: { getState: () => { hydrated: boolean } } };
    return !!w.__launchpad && w.__launchpad.getState().hydrated;
  });
}

/** Reset the demo to its seed and optionally sign in as a persona. */
export async function freshDemo(page: Page, personaId?: string, path = "/demo") {
  await openReady(page, path);
  await page.evaluate(async (p) => {
    const lp = (window as unknown as { __launchpad: { resetDemo: () => Promise<void>; setPersona: (id: string | null) => void } }).__launchpad;
    await lp.resetDemo();
    if (p) lp.setPersona(p);
  }, personaId ?? null);
}

export async function asPersona(page: Page, personaId: string) {
  await page.evaluate((p) => (window as unknown as { __launchpad: { setPersona: (id: string) => void } }).__launchpad.setPersona(p), personaId);
}

/** Run a function against window.__launchpad inside the page. */
 
export async function lp<T>(page: Page, fn: (lp: any, arg: any) => T | Promise<T>, arg?: unknown): Promise<T> {
  return page.evaluate(
     
    ([src, a]) => new Function("lp", "arg", `return (${src})(lp, arg)`)((window as any).__launchpad, a),
    [fn.toString(), arg] as const,
  ) as Promise<T>;
}
