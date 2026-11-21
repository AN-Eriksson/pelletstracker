import React, { useRef, useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

// Focus the first field only with a mouse or trackpad: on a phone it would open the keyboard
// over the screen before the user has seen it
const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

const INPUT_CLASSES =
  'w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

/** The whole screen shown when logged out: logo, a line about the app and the login form */
const LoginForm = ({ onLogin }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-[#efe6d8] bg-white p-5 shadow-sm sm:p-6"
          >
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            )}

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
        </div>
      </main>

      <p className="text-center text-xs text-gray-500">Konto får du av den som driver appen</p>
    </div>
  );
};

export default LoginForm;
