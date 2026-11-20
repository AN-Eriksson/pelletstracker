import React from 'react';

interface Props {
  label: string; // read by screen readers, e.g. "Vad är lager?"
  expanded: boolean;
  onToggle: () => void;
  controls: string; // id of the HelpText it shows and hides
}

/**
 * ⓘ button next to a card heading that shows or hides a short explanation.
 * A tap toggle instead of a hover tooltip, since there is no hover on a phone.
 */
export function HelpButton({ label, expanded, onToggle, controls }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full ${
        expanded ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.25v3.25a.75.75 0 0 0 1.5 0V9.75A.75.75 0 0 0 10 9H9Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function HelpText({
  id,
  hidden,
  children,
}: {
  id: string;
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      hidden={hidden}
      className="px-4 py-3 text-sm text-gray-600 bg-blue-50 border-b border-gray-200"
    >
      {children}
    </div>
  );
}
