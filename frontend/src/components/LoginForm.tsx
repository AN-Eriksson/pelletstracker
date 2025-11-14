import React, { useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

const LoginForm = ({ onLogin }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err?.message ?? 'Inloggning misslyckades');
    } finally {
      setLoading(false);
      setUsername('');
      setPassword('');
    }
  };

  return (
    
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <p><em>Psst.. användare är inte fullt implementerat ännu. För att testa - logga in med user:1234</em></p>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Användarnamn
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Loggar in…' : 'Logga in'}
      </button>
    </form>
  );
};

export default LoginForm;
