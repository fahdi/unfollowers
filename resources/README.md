# App icons and splash screens

`icon.png` and `splash.png` are the sources for every generated app icon and splash screen.

Regenerate the native assets with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets):

```bash
npx @capacitor/assets generate --assetPath resources
```

This writes into the `android/` and `ios/` projects, which are generated output and are not
committed. Create them first with `npx cap add android` / `npx cap add ios`.

Source image requirements:

| File         | Minimum size |
| ------------ | ------------ |
| `icon.png`   | 1024 × 1024  |
| `splash.png` | 2732 × 2732  |

> This project used Cordova until v1.0.0. `ionic cordova resources` no longer applies.
