import React, { useEffect } from 'react';

export interface Notice {
  kind: 'error' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

interface Props {
  notice: Notice | null;
  onDismiss: () => void;
}

// Long enough to read a two-line message; errors with an action stay until dismissed
const AUTO_DISMISS_MS = 8000;

/**
 * One message at a time at the top of the screen. Top rather than bottom, because the bottom sheets
 * (edit, stock, stations) keep their buttons at the bottom on mobile.
 */
export default function Toast({ notice, onDismiss }: Props) {
  useEffect(() => {
    if (!notice || notice.action) {
      return;
    }
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  // The live region stays mounted so screen readers announce messages that appear in it
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pointer-events-none"
      role={notice?.kind === 'error' ? 'alert' : 'status'}
      aria-live={notice?.kind === 'error' ? 'assertive' : 'polite'}
    >
      {notice && (
        <div
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border px-4 py-3 shadow-lg ${
            notice.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <p className="flex-1 py-1 text-sm">{notice.message}</p>
          {notice.action && (
            <button
              type="button"
              onClick={() => {
                onDismiss();
                notice.action?.onClick();
              }}
              className="min-h-11 shrink-0 rounded-md px-3 text-sm font-medium underline"
            >
              {notice.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Stäng meddelandet"
            className="min-h-11 min-w-11 shrink-0 rounded-md text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
