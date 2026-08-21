import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';
import { RegisterPage } from './register.page';

/** Stands in for the home tab so real navigation out of the form resolves. */
@Component({ template: '' })
class StubHomePage {}

describe('RegisterPage', () => {
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideIonicAngular(),
        provideRouter([{ path: 'tabs/home', component: StubHomePage }]),
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
  });

  function createPage() {
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const valid = { username: 'fahdi', password: 'hunter22', confirmPassword: 'hunter22' };

  it('starts with an invalid, empty form', () => {
    const page = createPage();

    expect(page.form.valid).toBe(false);
    expect(page.form.getRawValue()).toEqual({ username: '', password: '', confirmPassword: '' });
  });

  it('flags mismatched passwords on the form', () => {
    const page = createPage();

    page.form.setValue({ ...valid, confirmPassword: 'hunter23' });

    expect(page.form.hasError('passwordMismatch')).toBe(true);
    expect(page.form.valid).toBe(false);
  });

  it('clears the mismatch error once the passwords agree', () => {
    const page = createPage();
    page.form.setValue({ ...valid, confirmPassword: 'hunter23' });

    page.form.controls.confirmPassword.setValue('hunter22');

    expect(page.form.hasError('passwordMismatch')).toBe(false);
    expect(page.form.valid).toBe(true);
  });

  it('does not treat two empty passwords as a mismatch', () => {
    const page = createPage();

    expect(page.form.hasError('passwordMismatch')).toBe(false);
  });

  it('still rejects a short password even when both fields agree', () => {
    const page = createPage();

    page.form.setValue({ username: 'fahdi', password: 'short', confirmPassword: 'short' });

    expect(page.form.controls.password.hasError('minlength')).toBe(true);
    expect(page.form.valid).toBe(false);
  });

  it('does not establish a session when the form is invalid', () => {
    const page = createPage();

    page.submit();

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('establishes a session for the new account on a valid submit', () => {
    const page = createPage();
    page.form.setValue(valid);

    page.submit();

    expect(auth.session()).toEqual({ username: 'fahdi' });
  });

  it('sends the new user to the home tab', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const page = createPage();
    page.form.setValue(valid);

    page.submit();

    expect(navigate).toHaveBeenCalledWith('/tabs/home');
  });
});
