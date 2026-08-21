import { Injectable, computed, signal } from '@angular/core';

/** The identity of the currently signed-in user. */
export interface AuthSession {
  readonly username: string;
}

/**
 * Holds authentication state for the app.
 *
 * This is deliberately transport-agnostic: it owns *who is signed in*, not
 * *how they signed in*. No credential exchange is implemented yet, because
 * Instagram's Basic Display API was retired in December 2024 and the Graph API
 * does not expose a follower list, so the sign-in transport is still an open
 * question. Callers establish a session through `setSession`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentSession = signal<AuthSession | null>(null);

  /** The active session, or `null` when signed out. */
  readonly session = this.currentSession.asReadonly();

  /** Whether a session is currently established. */
  readonly isAuthenticated = computed(() => this.currentSession() !== null);

  setSession(session: AuthSession): void {
    this.currentSession.set(session);
  }

  signOut(): void {
    this.currentSession.set(null);
  }
}
