import React, { useMemo } from 'react';
import { Entry } from '../types/Entry';
import { parseLocalDate } from '../utilities/dateUtils';
import { formatAsSacks, formatKg } from '../lib/units';

interface Props {
  entries?: Entry[];
  onEdit: (entry: Entry) => void;
}

const MAX_ROWS = 5;

/** All consumption, in the CSV format scripts/import_numbers_csv.py reads */
const CSV_EXPORT_URL = '/api/pellets/export.csv';

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
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Senaste förbrukning</h2>
        {entries.length > 0 && (
          // A plain link: the browser downloads the file and sends the session cookie itself
          <a
            href={CSV_EXPORT_URL}
            download
            className="-my-2 flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline"
          >
            Exportera CSV
          </a>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-500">Inga poster ännu</div>
      ) : (
        <>
          {/* Mobile: the whole row is the tap target */}
          <ul className="divide-y divide-gray-200 sm:hidden">
            {latestEntries.map(entry => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  aria-label={`Redigera ${formatDate(entry.date)}`}
                  className="flex w-full min-h-14 items-center justify-between gap-4 px-4 py-2 text-left active:bg-gray-100"
                >
                  <span>{formatDate(entry.date)}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-right tabular-nums">
                      {formatKg(entry.amountKg)}
                      <span className="block text-xs text-gray-400">
                        {formatAsSacks(entry.amountKg)}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-xl text-gray-400">
                      ›
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mängd
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
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatKg(entry.amountKg)}
                      <div className="text-xs text-gray-400">{formatAsSacks(entry.amountKg)}</div>
                    </td>
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
