export class AuthManager {
  #TOKEN_KEY = 'pelletstracker_jwt';

  async loginRequest(username, password) {
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

  #saveToken(token) {
    localStorage.setItem(this.#TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(this.#TOKEN_KEY);
  }

  clearToken() {
    localStorage.removeItem(this.#TOKEN_KEY);
  }
}
