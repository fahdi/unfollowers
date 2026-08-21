import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [provideIonicAngular(), provideRouter([])],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(TabsPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes one tab button per section, in order', async () => {
    const fixture = TestBed.createComponent(TabsPage);
    await fixture.whenStable();

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('ion-tab-button'),
    );
    expect(buttons.map((b) => b.getAttribute('tab'))).toEqual(['home', 'about', 'contact']);
  });

  it('labels every tab button for screen readers', async () => {
    const fixture = TestBed.createComponent(TabsPage);
    await fixture.whenStable();

    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('ion-tab-button ion-label'),
    );
    expect(labels.map((l) => l.textContent?.trim())).toEqual(['Home', 'About', 'Contact']);
  });
});
