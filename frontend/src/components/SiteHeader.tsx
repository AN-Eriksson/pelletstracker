import React from 'react';

interface Props {
  onLogout?: () => void;
}

const SiteHeader = ({ onLogout }: Props) => {
  return (
    <header className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-4">
        <img src="/pelletlogo.png" alt="PelletTracker" className="h-12 w-auto sm:h-20" />
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="min-h-11 px-4 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100"
          >
            Logga ut
          </button>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
