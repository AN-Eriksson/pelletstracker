import React from 'react';

interface Props {
  /** Shown next to the logout button: the GitHub name, or the username */
  displayName?: string;
  onLogout?: () => void;
}

const SiteHeader = ({ displayName, onLogout }: Props) => {
  return (
    <header className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-4">
        <img src="/pelletlogo.png" alt="PelletTracker" className="h-12 w-auto sm:h-20" />
        {onLogout && (
          <div className="flex min-w-0 items-center gap-3">
            {displayName && (
              <span className="truncate text-sm text-gray-600" title={displayName}>
                {displayName}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 shrink-0 px-4 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100"
            >
              Logga ut
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
