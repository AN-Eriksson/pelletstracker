import { csrfHeader } from './csrf';

/**
 * Login state lives in an HttpOnly session cookie that scripts cannot read, so the backend is asked
 * (GET /auth/me) instead of checking a stored token.
 */
export class AuthManager {
  private onAuthChange?: (loggedIn: boolean) => void;

  setOnAuthChange(callback?: (loggedIn: boolean) => void) {
    this.onAuthChange = callback;
  }

  private emitAuthChange(value: boolean) {
    this.onAuthChange?.(value);
  }

  /** Whether the session cookie belongs to a logged-in session. Also hands out the CSRF cookie. */
  async checkSession(): Promise<boolean> {
    try {
      const response = await fetch('/auth/me', { headers: { Accept: 'application/json' } });
      return response.ok;
    } catch {
      return false; // backend unreachable: show the login form
    }
  }

  async loginRequest(username: string, password: string): Promise<void> {
    // The login POST needs the CSRF cookie; it is set by any earlier response, normally /auth/me
    if (Object.keys(csrfHeader()).length === 0) {
      await this.checkSession();
    }

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 401) {
      throw new Error('Fel användarnamn eller lösenord');
    }

    if (!response.ok) {
      throw new Error(`Inloggningen misslyckades (${response.status})`);
    }

    this.emitAuthChange(true);
  }

  /** Ends the session on the server, then shows the login form. */
  async logOut(): Promise<void> {
    try {
      await fetch('/auth/logout', { method: 'POST', headers: csrfHeader() });
    } catch (err) {
      console.error('Logout request failed', err);
    }
    this.emitAuthChange(false);
  }

  /** The backend already says the session is gone (401): only update the UI. */
  sessionExpired() {
    this.emitAuthChange(false);
  }
}
