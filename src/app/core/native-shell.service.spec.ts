import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NativeShellService } from './native-shell.service';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));
vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: vi.fn().mockResolvedValue(undefined) },
  Style: { Default: 'DEFAULT' },
}));

describe('NativeShellService', () => {
  let service: NativeShellService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NativeShellService);
  });

  describe('on a native platform', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    });

    it('hides the splash screen once the app is ready', async () => {
      await service.initialize();

      expect(SplashScreen.hide).toHaveBeenCalledOnce();
    });

    it('applies the default status bar style', async () => {
      await service.initialize();

      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Default });
    });
  });

  describe('on the web', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it('does not touch the status bar, which has no web implementation', async () => {
      await service.initialize();

      expect(StatusBar.setStyle).not.toHaveBeenCalled();
    });

    it('does not call the splash screen plugin', async () => {
      await service.initialize();

      expect(SplashScreen.hide).not.toHaveBeenCalled();
    });

    it('resolves rather than throwing', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });
  });

  it('never rejects when a native plugin fails, so bootstrap is not blocked', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(SplashScreen.hide).mockRejectedValueOnce(new Error('no such plugin'));

    await expect(service.initialize()).resolves.toBeUndefined();
  });
});
