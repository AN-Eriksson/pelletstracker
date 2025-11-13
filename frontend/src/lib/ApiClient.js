export class ApiClient {
  constructor(authManager) {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.authManager = authManager;
  }

  async request(endpoint, { method, body = undefined }) {
    const authHeader = this.authManager.getAuthHeader();
    const headers = { ...this.defaultHeaders, ...authHeader };

    const init = { method, headers };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, init);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  get(path) {
    return this.request(path, { method: 'GET' });
  }
  post(path, body) {
    return this.request(path, { method: 'POST', body });
  }
  put(path, body) {
    return this.request(path, { method: 'PUT', body });
  }
  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}
