import React, { useEffect, useRef, useState } from 'react';
import { LoginOptions } from '../types/Auth';
import { GITHUB_LOGIN_URL } from '../lib/AuthManager';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
  /** From GET /auth/config; null if the server could not be reached */
  options: LoginOptions | null;
  /** E.g. why the GitHub login just failed */
  initialError?: string | null;
}

// Focus the first field only with a mouse or trackpad: on a phone it would open the keyboard
// over the screen before the user has seen it
const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

const INPUT_CLASSES =
  'w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// GitHub's mark (Octicons, MIT)
const GitHubMark = () => (
  <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

/** The whole screen shown when logged out: logo, a line about the app and the ways to log in */
const LoginForm = ({ onLogin, options, initialError = null }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [toGitHub, setToGitHub] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Back from GitHub with the browser's back button: the page comes from the cache, still saying
  // "Skickar dig till GitHub…"
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setToGitHub(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const github = options?.github ?? false;
  const passwordLogin = options?.passwordLogin ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err?.message ?? 'Inloggningen misslyckades. Försök igen.');
      // Keep the username, so only the password has to be typed again
      setPassword('');
      passwordRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbf7f1] px-4 pt-[env(safe-area-inset-top)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <main className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <img
              src="/pelletlogo.png"
              alt="PelletTracker"
              className="mx-auto h-20 w-auto sm:h-24"
            />
            <p className="mt-3 text-sm text-gray-600">
              Håll koll på pelletsförbrukningen - logga och se statistik
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-[#efe6d8] bg-white p-5 shadow-sm sm:p-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {options === null && (
              <div role="alert" className="space-y-3 text-sm text-gray-700">
                <p>Servern gick inte att nå. Kontrollera anslutningen och försök igen.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-100"
                >
                  Försök igen
                </button>
              </div>
            )}

            {github && (
              // A plain link: the login is a round trip through GitHub, not a request from here
              <a
                href={GITHUB_LOGIN_URL}
                onClick={() => setToGitHub(true)}
                aria-disabled={toGitHub}
                className={`flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 ${
                  toGitHub ? 'pointer-events-none cursor-wait' : ''
                }`}
              >
                <GitHubMark />
                {toGitHub ? 'Skickar dig till GitHub…' : 'Logga in med GitHub'}
              </a>
            )}

            {github && passwordLogin && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="h-px flex-1 bg-gray-200" />
                eller med användarnamn
                <span className="h-px flex-1 bg-gray-200" />
              </div>
            )}

            {passwordLogin && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="username">
                    Användarnamn
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus={hasFinePointer()}
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="password">
                    Lösenord
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${INPUT_CLASSES} pr-16`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(shown => !shown)}
                      aria-pressed={showPassword}
                      aria-controls="password"
                      className="absolute inset-y-0 right-0 min-w-14 rounded-r-lg px-3 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? 'Dölj' : 'Visa'}
                    </button>
                  </div>
                </div>

                {/* Keeps its colour while waiting: a grey button looks broken rather than busy */}
                <button
                  type="submit"
                  aria-disabled={loading}
                  className={`w-full min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 ${
                    loading ? 'cursor-wait' : ''
                  }`}
                >
                  {loading ? 'Loggar in…' : 'Logga in'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <p className="text-center text-xs text-gray-500">
        {github
          ? 'Första gången du loggar in med GitHub skapas ett konto åt dig'
          : 'Konto får du av den som driver appen'}
      </p>
    </div>
  );
};

export default LoginForm;
