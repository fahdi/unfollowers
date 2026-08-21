import { Routes } from '@angular/router';
import { routes } from './app.routes';

/** Walks a route tree and returns every fully-qualified path it can match. */
function pathsOf(tree: Routes, prefix = ''): string[] {
  return tree.flatMap((route) => {
    const here = [prefix, route.path].filter((s) => s !== undefined && s !== '').join('/');
    return route.children?.length ? pathsOf(route.children, here) : [here];
  });
}

describe('app routes', () => {
  it('redirects the empty path to the home tab', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('/tabs/home');
    expect(root?.pathMatch).toBe('full');
  });

  it('nests every section under the tabs shell', () => {
    expect(pathsOf(routes)).toEqual(
      expect.arrayContaining(['tabs/home', 'tabs/about', 'tabs/contact']),
    );
  });

  it('lazy-loads each tab so no page is in the initial bundle', () => {
    const tabs = routes.find((r) => r.path === 'tabs');
    const pages = (tabs?.children ?? []).filter((c) => c.path !== '');

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(page.loadComponent, `route "${page.path}" should use loadComponent`).toBeDefined();
      expect(page.component, `route "${page.path}" should not eagerly import`).toBeUndefined();
    }
  });
});
