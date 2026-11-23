import { csrfHeader } from './csrf';
import { CurrentUser, LoginOptions } from '../types/Auth';

/** Where the "Logga in med GitHub" link goes; Spring sends the browser on to GitHub from there */
export const GITHUB_LOGIN_URL = '/oauth2/authorization/github';

/**
 * Login state lives in an HttpOnly session cookie that scripts cannot read, so the backend is asked
 * (GET /auth/me) instead of checking a stored token.
 */
export class AuthManager {
  private onAuthChange?: (user: CurrentUser | null) => void;

  /** Called with the user after a login, and with null after logout or an expired session */
  setOnAuthChange(callback?: (user: CurrentUser | null) => void) {
    this.onAuthChange = callback;
  }

  private emitAuthChange(user: CurrentUser | null) {
    this.onAuthChange?.(user);
  }

  /** The user the session cookie is logged in as, or null. Also hands out the CSRF cookie. */
  async checkSession(): Promise<CurrentUser | null> {
    try {
      const response = await fetch('/auth/me', { headers: { Accept: 'application/json' } });
      return response.ok ? ((await response.json()) as CurrentUser) : null;
    } catch {
      return null; // backend unreachable: show the login form
    }
  }

  /** Which login buttons and fields to show; null if the server could not be reached */
  async loginOptions(): Promise<LoginOptions | null> {
    try {
      const response = await fetch('/auth/config', { headers: { Accept: 'application/json' } });
      return response.ok ? ((await response.json()) as LoginOptions) : null;
    } catch {
      return null;
    }
  }

  async loginRequest(username: string, password: string): Promise<void> {
    // The login POST needs the CSRF cookie; it is set by any earlier response, normally /auth/me
    if (Object.keys(csrfHeader()).length === 0) {
      await this.checkSession();
    }

    let response: Response;
    try {
      response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      // Otherwise the form would show the browser's English "Failed to fetch"
      throw new Error('Servern gick inte att nå. Kontrollera anslutningen och försök igen.');
    }

    if (response.status === 401) {
      throw new Error('Fel användarnamn eller lösenord');
    }

    if (response.status === 403) {
      throw new Error('Inloggningen nekades. Ladda om sidan och försök igen.');
    }

    if (!response.ok) {
      throw new Error(`Inloggningen misslyckades (${response.status}). Försök igen.`);
    }

    this.emitAuthChange((await response.json()) as CurrentUser);
  }

  /**
   * Ends the session on the server, then shows the login form. Throws (with `status`, like ApiClient) if
   * the server did not confirm it: showing the login form then would hide a session that is still valid.
   */
  async logOut(): Promise<void> {
    let response: Response;
    try {
      response = await fetch('/auth/logout', { method: 'POST', headers: csrfHeader() });
    } catch (cause) {
      throw Object.assign(new Error('Logout request failed', { cause }), { status: 0 });
    }

    // 401: the session had already ended, which is what we wanted
    if (!response.ok && response.status !== 401) {
      throw Object.assign(new Error(`Logout failed: HTTP ${response.status}`), {
        status: response.status,
      });
    }
    this.emitAuthChange(null);
  }

  /** The backend already says the session is gone (401): only update the UI. */
  sessionExpired() {
    this.emitAuthChange(null);
  }
}
