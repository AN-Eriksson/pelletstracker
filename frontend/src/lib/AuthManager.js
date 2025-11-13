export class AuthManager {
  #TOKEN_KEY = 'pelletstracker_jwt';

  async loginRequest(username, password) {
    const credentials = { username, password };

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const json = await response.json();

    console.log(json);
  }
}
