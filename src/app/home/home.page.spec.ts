import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { HomePage } from './home.page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideIonicAngular()],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders "Home" as its toolbar title', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();

    const title = (fixture.nativeElement as HTMLElement).querySelector('ion-title');
    expect(title?.textContent?.trim()).toBe('Home');
  });
});
