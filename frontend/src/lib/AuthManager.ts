export class AuthManager {
  private readonly TOKEN_KEY: string = 'pelletstracker_jwt';

  async loginRequest(username: string, password: string): Promise<void> {
    const credentials = { username, password };

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const json = await response.json();

    this.#saveToken(json.token);
  }

  #saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated() {
    return this.getToken() !== null;
  }

  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
