import React, { useMemo, useEffect, useState } from 'react';

export default function RecentInputsTable({ entries = [], onEdit }) {
  const formatDate = dateVal => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toISOString().split('T')[0];
  };

  const fiveLatestEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [entries]);

  if (!entries || entries.length === 0) {
    return <div className="text-sm text-gray-500">Inga poster ännu</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datum
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Antal säckar
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Åtgärder
            </th>
          </tr>
        </thead>
        <tbody>
          {fiveLatestEntries.map((entry, idx) => {
            const key = entry.id;
            return (
              <tr key={key}>
                <td>{formatDate(entry.date)}</td>
                <td>{entry.numberOfSacks}</td>
                <td className="text-right">
                  <button
                    onClick={() => onEdit(entry)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Redigera
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
