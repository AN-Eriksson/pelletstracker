// Spring Security keeps the CSRF token in the readable XSRF-TOKEN cookie and expects it back in the
// X-XSRF-TOKEN header on every request that changes something (POST, PUT, DELETE)
const COOKIE_NAME = 'XSRF-TOKEN';
const HEADER_NAME = 'X-XSRF-TOKEN';

export function csrfHeader(): Record<string, string> {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? { [HEADER_NAME]: decodeURIComponent(match[1]) } : {};
}
