import { TestBed } from '@angular/core/testing';
import { AuthService, AuthSession } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  const session: AuthSession = { username: 'fahdi' };

  it('starts with no session', () => {
    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('exposes the session once one is established', () => {
    service.setSession(session);

    expect(service.session()).toEqual(session);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears the session on sign out', () => {
    service.setSession(session);

    service.signOut();

    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('keeps isAuthenticated in step with the session signal', () => {
    expect(service.isAuthenticated()).toBe(false);
    service.setSession(session);
    expect(service.isAuthenticated()).toBe(true);
    service.signOut();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('is provided application-wide as a singleton', () => {
    expect(TestBed.inject(AuthService)).toBe(service);
  });
});
