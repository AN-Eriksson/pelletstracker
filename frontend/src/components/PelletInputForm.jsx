import React, { useState } from 'react';

export default function PelletInputForm({ onAddEntry }) {
  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  })();

  const [date, setDate] = useState(todayIso);
  const [numberOfSacks, setNumberOfSacks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    const n = parseInt(numberOfSacks, 10);
    if (!date || Number.isNaN(n) || n < 0) return;

    try {
      setLoading(true);
      const result = await onAddEntry(date, n);
      if (result) {
        setNumberOfSacks('');
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="max-w-[240px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-w-[240px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Antal säckar</label>
          <input
            type="number"
            value={numberOfSacks}
            onChange={e => setNumberOfSacks(e.target.value)}
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-w-[240px]">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Lägger till...' : 'Lägg till'}
          </button>
        </div>
      </div>
    </form>
  );
}
