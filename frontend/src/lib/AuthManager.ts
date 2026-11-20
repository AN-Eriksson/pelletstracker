export class AuthManager {
  private readonly TOKEN_KEY: string = 'pelletstracker_jwt';
  private onAuthChange?: (loggedIn: boolean) => void;

  setOnAuthChange(callback?: (loggedIn: boolean) => void) {
    this.onAuthChange = callback;
  }

  private emitAuthChange(value: boolean) {
    this.onAuthChange?.(value);
  }

  async loginRequest(username: string, password: string): Promise<void> {
    const credentials = { username, password };

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (response.status === 401) {
      throw new Error('Fel användarnamn eller lösenord');
    }

    if (!response.ok) {
      throw new Error(`Inloggningen misslyckades (${response.status})`);
    }

    const json = await response.json();

    this.#saveToken(json.token);
    this.emitAuthChange(true);
  }

  #saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logOut() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.emitAuthChange(false);
  }

  /**
   * True when a token is stored and has not expired. An expired token is removed, so the app
   * shows the login form at once instead of an empty view that fails on the first request.
   */
  isAuthenticated() {
    const token = this.getToken();
    if (token === null) {
      return false;
    }

    if (this.#isExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      return false;
    }

    return true;
  }

  // Reads `exp` (seconds) from the JWT payload. The signature is the backend's business;
  // this is only to avoid using a token we already know it will reject.
  #isExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload));
      return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch {
      return true; // not a readable JWT
    }
  }

  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
