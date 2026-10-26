import React, { useMemo } from 'react';
import { Entry } from '../types/Entry';
import { parseLocalDate } from '../utilities/dateUtils';

interface Props {
  entries?: Entry[];
  onEdit: (entry: Entry) => void;
}

const MAX_ROWS = 5;

export default function RecentInputsTable({ entries = [], onEdit }: Props) {
  const formatDate = (dateVal?: string | Date): string => {
    if (!dateVal) {
      return '';
    }

    return parseLocalDate(dateVal).toLocaleDateString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const latestEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_ROWS);
  }, [entries]);

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <h2 className="px-4 py-3 text-lg font-semibold border-b border-gray-200">
        Senaste inmatningar
      </h2>

      {entries.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-500">Inga poster ännu</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Antal säckar
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {latestEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{formatDate(entry.date)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{entry.numberOfSacks}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                      >
                        Redigera
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            Visar {latestEntries.length} av {entries.length}
          </div>
        </>
      )}
    </div>
  );
}
