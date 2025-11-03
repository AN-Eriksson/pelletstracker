import React from 'react';

export default function RecentInputsTable({ entries = [] }) {
  const formatDate = dateVal => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toISOString().split('T')[0];
  };

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
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry, idx) => {
            const key = entry.id;
            return (
              <tr key={key}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(entry.date)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {entry.numberOfSacks}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right"></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
