import React from 'react';

interface Props {
  onLogout?: () => void;
}

const SiteHeader = ({ onLogout }: Props) => {
  return (
    <header className="flex items-center justify-between">
      <img src="/pelletlogo.png" alt="logo" width="200" />
      <h1 className="text-2xl font-bold mb-6">Logga och följ din pelletsförbrukning!</h1>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="mb-6 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Logga ut
        </button>
      )}
    </header>
  );
};

export default SiteHeader;
