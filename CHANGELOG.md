# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-21

Complete modernisation of the toolchain. The project previously could not be installed on any
current Node release, and had no tests.

### Added

- Vitest 4 test suite (45 tests) via `@angular/build:unit-test`, with coverage reporting.
- ESLint 10 flat config with angular-eslint 22, plus Prettier and a `format:check` gate.
- GitHub Actions CI running format, lint, test and build on Node 20, 22 and 24.
- Capacitor 8 replacing Cordova, with `NativeShellService` guarding native-only plugin calls.
- Reactive-forms sign-in and registration pages, with a password-confirmation validator.
- `AuthService` holding signal-based session state.
- Wildcard route redirecting unknown paths to the home tab.
- `LICENSE` (MIT) and this changelog.

### Changed

- Angular 5 → Angular 22, NgModules → standalone components.
- Ionic 3 → Ionic 9. The `@ionic/angular/standalone` entry point from Ionic 8 is gone; the root
  export is now the standalone API.
- TypeScript 2.4 → 6.0, with `strict` and `strictTemplates` enabled.
- `@ionic/app-scripts` → `@angular/build:application` (esbuild).
- Change detection is now zoneless; `zone.js` is no longer a dependency.
- All routes are lazy via `loadComponent`.
- The Contact page links to this repository's issue tracker instead of the Ionic starter's
  placeholder Twitter handle.

### Removed

- `node-sass`, whose native build via node-gyp 3.6.2 required Python 2 and broke installation
  entirely on Node 22.
- tslint, end-of-life since 2019.
- Cordova `config.xml` and the pre-generated `resources/ios` and `resources/android` image sets.
- The Ionic 3 starter's placeholder `myApp` identity and `service-worker.js`.

### Fixed

- `npm install` now succeeds on current Node releases. It previously failed with
  `gyp ERR! stack Error: Can't find Python executable "python"`.

[1.0.0]: https://github.com/fahdi/unfollowers/releases/tag/v1.0.0
