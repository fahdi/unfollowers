# Unfollowers

[![CI](https://github.com/fahdi/unfollowers/actions/workflows/ci.yml/badge.svg)](https://github.com/fahdi/unfollowers/actions/workflows/ci.yml)

Instagram unfollowers can be amazing, as long as they are not annoying. There is a recurring
behaviour where people follow you, then unfollow as soon as you follow back.

This app exists to surface that. It is small on purpose: no ads, no upsell, one job done properly.

## Status

The app shell is complete and runs on a current toolchain. **The follower-diffing feature is not
implemented yet**, and the sign-in flow does not authenticate against anything — see
[Instagram API access](#instagram-api-access) for why that is a design question rather than a
to-do item.

## Tech stack

|           |                                              |
| --------- | -------------------------------------------- |
| Framework | Angular 22 (standalone, zoneless)            |
| UI        | Ionic 9                                      |
| Native    | Capacitor 8                                  |
| Language  | TypeScript 6.0, `strict` + `strictTemplates` |
| Build     | `@angular/build:application` (esbuild)       |
| Tests     | Vitest 4 via `@angular/build:unit-test`      |
| Lint      | ESLint 10 flat config + angular-eslint 22    |
| Format    | Prettier                                     |

> TypeScript 7 is published, but Angular 22 pins `typescript: ">=6.0 <6.1"`. Do not bump it past
> 6.0 until Angular's peer range moves.

## Requirements

Node.js 22.22.3 or newer. The Angular CLI rejects anything older, and also accepts the 24.15+ and
26+ lines. Node 22, 24 and 26 are exercised in CI.

## Getting started

```bash
npm install
npm start
```

The dev server runs at http://localhost:4200.

## Commands

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm start`            | Dev server with hot reload                       |
| `npm run build`        | Production build into `dist/unfollowers/browser` |
| `npm test`             | Run the unit tests once                          |
| `npm run test:watch`   | Re-run tests on change                           |
| `npm run test:ci`      | Tests with coverage, no watch                    |
| `npm run lint`         | ESLint over TypeScript and templates             |
| `npm run format`       | Rewrite files with Prettier                      |
| `npm run format:check` | Fail if anything is unformatted                  |
| `npm run sync`         | Copy the web build into the native projects      |
| `npm run build:native` | Build, then sync                                 |

## Running on a device

The `android/` and `ios/` directories are generated output and are not committed.

```bash
npm run build
npx cap add ios          # and/or: npx cap add android
npm run sync
npx cap open ios         # opens Xcode / Android Studio
```

App icons and splash screens regenerate from `resources/icon.png` and `resources/splash.png`:

```bash
npx @capacitor/assets generate --assetPath resources
```

## Project layout

```
src/
├── app/
│   ├── about/          About page
│   ├── auth/           Session state (AuthService)
│   ├── contact/        Contact page
│   ├── core/           Native startup chrome (NativeShellService)
│   ├── home/           Home page
│   ├── login/          Sign-in form
│   ├── register/       Registration form
│   ├── tabs/           Tab bar shell
│   ├── app.config.ts   Application providers
│   └── app.routes.ts   Route table
├── theme/              Ionic CSS variables
├── index.html
├── main.ts             Bootstrap
└── styles.scss         Global styles + Ionic stylesheets
```

Every route is lazy via `loadComponent`, and a test enforces that so no page slips into the
initial bundle.

## Instagram API access

The follower comparison this app is named after cannot currently be built against Instagram's
official APIs:

- The **Instagram Basic Display API** was retired on 4 December 2024.
- The **Instagram Graph API** exposes a follower _count_, but not the follower _list_.

So there is no sanctioned way to read who follows an account. Any implementation has to either
work from a user's own [data export](https://www.instagram.com/download/request/), or use an
unofficial route that violates Instagram's Terms of Use and risks the user's account. `AuthService`
is deliberately transport-agnostic until that decision is made.

## Contributing

CI runs formatting, lint, tests and a build on every pull request. Before pushing:

```bash
npm run format && npm run lint && npm test && npm run build
```

New behaviour is written test-first.

## License

[MIT](LICENSE) © Fahad Murtaza
