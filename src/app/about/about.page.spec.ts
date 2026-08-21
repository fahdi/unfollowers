import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { AboutPage } from './about.page';

describe('AboutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [provideIonicAngular()],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(AboutPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders "About" as its toolbar title', async () => {
    const fixture = TestBed.createComponent(AboutPage);
    await fixture.whenStable();

    const title = (fixture.nativeElement as HTMLElement).querySelector('ion-title');
    expect(title?.textContent?.trim()).toBe('About');
  });
});
