import { csrfHeader } from './csrf';

// Session cookie and CSRF header instead of a bearer token: fetch sends the cookie by itself (same origin)
export class ApiClient {
  #opts;
  #defaultHeaders;

  constructor(opts) {
    this.#defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.#opts = opts;
  }

  async request(endpoint, { method, body = undefined }) {
    const headers = method === 'GET' ? this.#defaultHeaders : { ...this.#defaultHeaders, ...csrfHeader() };

    const init = { method, headers };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, init);

    // Only 401 means logged out. 403 is a CSRF or permission problem and should not end the session
    if (response.status === 401) {
      this.#handleUnauthorized();
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status; // lets callers react to e.g. 409 Conflict
      throw error;
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
    this.#opts?.onUnauthorized?.();
  }
}
