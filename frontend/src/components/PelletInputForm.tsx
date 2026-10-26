import React, { useEffect, useId, useRef, useState } from 'react';
import { stripTimeFromDate } from '../utilities/dateUtils';
import SegmentedControl, { Option } from './SegmentedControl';

interface Props {
  onAddEntry: (date: string, numberOfSacks: number) => Promise<void>;
}

const todayIso = () => stripTimeFromDate(new Date());

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return stripTimeFromDate(d);
};

const QUICK_PICKS: Option<string>[] = ['1', '2', '3', '4'].map(n => ({ value: n, label: n }));

export default function PelletInputForm({ onAddEntry }: Props) {
  const dateId = useId();
  const sacksId = useId();
  const [date, setDate] = useState(todayIso);
  const [numberOfSacks, setNumberOfSacks] = useState('');
  const [loading, setLoading] = useState(false);

  // If the tab stays open past midnight, move the default date along to the new day,
  // unless the user has picked another date
  const lastTodayRef = useRef(todayIso());
  useEffect(() => {
    const refreshToday = () => {
      const today = todayIso();
      setDate(prev => (prev === lastTodayRef.current ? today : prev));
      lastTodayRef.current = today;
    };

    window.addEventListener('focus', refreshToday);
    document.addEventListener('visibilitychange', refreshToday);
    return () => {
      window.removeEventListener('focus', refreshToday);
      document.removeEventListener('visibilitychange', refreshToday);
    };
  }, []);

  const dateShortcuts: Option<string>[] = [
    { value: todayIso(), label: 'Idag' },
    { value: yesterdayIso(), label: 'Igår' },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numberOfSacksParsed = parseInt(numberOfSacks, 10);
    if (!date || Number.isNaN(numberOfSacksParsed) || numberOfSacksParsed < 1) {
      return;
    }

    try {
      setLoading(true);
      await onAddEntry(date, numberOfSacksParsed);
      setNumberOfSacks('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white rounded shadow">
      <h2 className="px-4 py-3 text-lg font-semibold border-b border-gray-200">Ny inmatning</h2>

      <div className="flex flex-wrap items-end gap-4 p-4">
        <div>
          <label htmlFor={dateId} className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <div className="flex gap-2">
            <input
              id={dateId}
              type="date"
              value={date}
              max={todayIso()}
              onChange={e => setDate(e.target.value)}
              required
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <SegmentedControl
              label="Välj datum"
              options={dateShortcuts}
              value={date}
              onChange={setDate}
              size="md"
            />
          </div>
        </div>

        <div>
          <label htmlFor={sacksId} className="block text-sm font-medium text-gray-700 mb-1">
            Antal säckar
          </label>
          <div className="flex gap-2">
            <SegmentedControl
              label="Välj antal säckar"
              options={QUICK_PICKS}
              value={numberOfSacks}
              onChange={setNumberOfSacks}
              size="md"
            />
            <input
              id={sacksId}
              type="number"
              inputMode="numeric"
              value={numberOfSacks}
              onChange={e => setNumberOfSacks(e.target.value)}
              min="1"
              step="1"
              required
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full sm:w-auto py-2 px-6 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Lägger till...' : 'Lägg till'}
        </button>
      </div>
    </form>
  );
}
