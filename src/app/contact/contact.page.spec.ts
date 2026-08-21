import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { ContactPage } from './contact.page';

describe('ContactPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [provideIonicAngular()],
    }).compileComponents();
  });

  it('creates the page', () => {
    const fixture = TestBed.createComponent(ContactPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders "Contact" as its toolbar title', async () => {
    const fixture = TestBed.createComponent(ContactPage);
    await fixture.whenStable();

    const title = (fixture.nativeElement as HTMLElement).querySelector('ion-title');
    expect(title?.textContent?.trim()).toBe('Contact');
  });
});
