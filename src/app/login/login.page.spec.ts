import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';
import { LoginPage } from './login.page';

/** Stands in for the home tab so real navigation out of the form resolves. */
@Component({ template: '' })
class StubHomePage {}

describe('LoginPage', () => {
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideIonicAngular(),
        provideRouter([{ path: 'tabs/home', component: StubHomePage }]),
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
  });

  function createPage() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  it('starts with an invalid, empty form', () => {
    const page = createPage().componentInstance;

    expect(page.form.valid).toBe(false);
    expect(page.form.getRawValue()).toEqual({ username: '', password: '' });
  });

  it('requires a username', () => {
    const page = createPage().componentInstance;

    page.form.controls.password.setValue('hunter22');

    expect(page.form.controls.username.hasError('required')).toBe(true);
    expect(page.form.valid).toBe(false);
  });

  it('rejects a password shorter than eight characters', () => {
    const page = createPage().componentInstance;

    page.form.controls.password.setValue('short');

    expect(page.form.controls.password.hasError('minlength')).toBe(true);
  });

  it('becomes valid once both fields are filled in', () => {
    const page = createPage().componentInstance;

    page.form.setValue({ username: 'fahdi', password: 'hunter22' });

    expect(page.form.valid).toBe(true);
  });

  it('does not establish a session when the form is invalid', () => {
    const page = createPage().componentInstance;

    page.submit();

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('marks the form as touched on an invalid submit so errors become visible', () => {
    const page = createPage().componentInstance;

    page.submit();

    expect(page.form.controls.username.touched).toBe(true);
    expect(page.form.controls.password.touched).toBe(true);
  });

  it('establishes a session for the entered username on a valid submit', () => {
    const page = createPage().componentInstance;
    page.form.setValue({ username: 'fahdi', password: 'hunter22' });

    page.submit();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.session()).toEqual({ username: 'fahdi' });
  });

  it('sends the user to the home tab after signing in', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const page = createPage().componentInstance;
    page.form.setValue({ username: 'fahdi', password: 'hunter22' });

    page.submit();

    expect(navigate).toHaveBeenCalledWith('/tabs/home');
  });
});
