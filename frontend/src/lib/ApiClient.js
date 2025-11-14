export class ApiClient {
  #authManager;
  #opts;

  constructor(authManager, opts) {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.authManager = authManager;
    this.opts = opts;
  }

  async request(endpoint, { method, body = undefined }) {
    const authHeader = this.authManager.getAuthHeader();
    const headers = { ...this.defaultHeaders, ...authHeader };

    const init = { method, headers };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, init);

    if (response.status === 401 || response.status === 403) {
      // token expired / invalid
      this.#handleUnauthorized();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text().catch(() => '');
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      return text;
    }
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

  #handleUnauthorized() {
    this.opts.onUnauthorized();
  }
}
