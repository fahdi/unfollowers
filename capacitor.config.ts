import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fahdi.unfollowers',
  appName: 'Unfollowers',
  // Angular 22's application builder emits the browser bundle into a
  // `browser/` subdirectory of the output path.
  webDir: 'dist/unfollowers/browser',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
