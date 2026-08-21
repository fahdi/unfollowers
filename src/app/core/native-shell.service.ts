import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Applies the native chrome the app wants at startup.
 *
 * Replaces the Cordova `platform.ready()` block from the Ionic 3 app. The
 * native guard matters: StatusBar and SplashScreen have no web implementation,
 * so calling them in a browser logs plugin errors for no benefit.
 */
@Injectable({ providedIn: 'root' })
export class NativeShellService {
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setStyle({ style: Style.Default });
      await SplashScreen.hide();
    } catch (error) {
      // Startup chrome is cosmetic; never let it block bootstrap.
      console.warn('Native shell initialisation failed', error);
    }
  }
}
