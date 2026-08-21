# Unfollowers

[![CI](https://github.com/fahdi/unfollowers/actions/workflows/ci.yml/badge.svg)](https://github.com/fahdi/unfollowers/actions/workflows/ci.yml)

Instagram unfollowers can be amazing, as long as they are not annoying. There is a recurring
behaviour where people follow you, then unfollow as soon as you follow back.

This app exists to surface that. It is small on purpose: no ads, no upsell, one job done properly.

## Status

Working. Drop in an Instagram data export and the app reports who does not follow you back, who
you have not followed back, and your mutuals — and, from the second export onwards, exactly who
unfollowed you since last time.

The sign-in flow still does not authenticate against anything, and does not need to: the report is
computed entirely on device. See [Instagram API access](#instagram-api-access) for why there is no
live follower feed to sign in to.

## How it works

1. Request your data from Instagram: **Settings → Accounts Centre → Your information and
   permissions → Export your information**. Pick **Followers and following**, all time, format
   **JSON**.
2. Instagram emails a ZIP, usually within a few minutes.
3. Drop that ZIP onto the home tab.

The archive is unzipped in the browser with [fflate](https://github.com/101arrowz/fflate); nothing
is uploaded anywhere, and there is no account to create. The only thing written to storage is the
list of follower handles from your last import, which is what lets the next import name who left.
"Forget my data" deletes it.

Three export shapes are read, because Instagram has shipped all of them:

| Shape                            | Where it appears                                 |
| -------------------------------- | ------------------------------------------------ |
| Bare top-level array             | `followers_1.json`                               |
| `relationships_*` wrapper object | `following.json`, `pending_follow_requests.json` |
| HTML anchors                     | `followers_1.html` when HTML format is chosen    |

Large accounts get their followers split across `followers_1.json`, `followers_2.json` and so on;
those are merged and de-duplicated. If you would rather not wait for an export, the home tab also
takes two pasted lists of handles.

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
│   ├── home/           Home page — import, report and results
│   ├── instagram/      Export parsing, archive reading and the comparison
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

So there is no sanctioned way to read who follows an account, and scraping one is both against
Instagram's Terms of Use and a good way to get an account restricted. This app therefore reads the
user's own [data export](https://www.instagram.com/download/request/), which is the only route that
is both complete and permitted.

The ingestion layer is deliberately kept separate from the comparison in `src/app/instagram/`, so
if a follower-list API ever appears it can be added as another source without touching the
analysis. `AuthService` stays transport-agnostic for the same reason.

## Contributing

CI runs formatting, lint, tests and a build on every pull request. Before pushing:

```bash
npm run format && npm run lint && npm test && npm run build
```

New behaviour is written test-first.

## License

[MIT](LICENSE) © Fahad Murtaza
