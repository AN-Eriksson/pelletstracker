import React, { useEffect, useId, useRef, useState } from 'react';
import { stripTimeFromDate } from '../utilities/dateUtils';
import SegmentedControl, { Option } from './SegmentedControl';
import { Unit, formatKg, sacksToKg } from '../lib/units';

interface Props {
  onAddEntry: (date: string, amountKg: number) => Promise<void>;
  onAddDelivery: (date: string, amountKg: number) => Promise<void>;
}

type Kind = 'consumption' | 'delivery';

const KIND_OPTIONS: Option<Kind>[] = [
  { value: 'consumption', label: 'Förbrukning' },
  { value: 'delivery', label: 'Påfyllning' },
];

const todayIso = () => stripTimeFromDate(new Date());

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return stripTimeFromDate(d);
};

const QUICK_PICKS: Option<string>[] = ['1', '2', '3', '4'].map(n => ({ value: n, label: n }));

const UNIT_OPTIONS: Option<Unit>[] = [
  { value: 'sacks', label: 'Säckar' },
  { value: 'kg', label: 'kg' },
];

export default function PelletInputForm({ onAddEntry, onAddDelivery }: Props) {
  const dateId = useId();
  const amountId = useId();
  const [date, setDate] = useState(todayIso);
  const [kind, setKind] = useState<Kind>('consumption');
  const [unit, setUnit] = useState<Unit>('sacks');
  const [amount, setAmount] = useState('');
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

  const amountParsed = parseInt(amount, 10);
  const isValidAmount = !Number.isNaN(amountParsed) && amountParsed >= 1;
  const amountKg = unit === 'sacks' ? sacksToKg(amountParsed) : amountParsed;

  // The entered amount means something else in the other unit, so start over
  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
    setAmount('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!date || !isValidAmount) {
      return;
    }

    try {
      setLoading(true);
      if (kind === 'delivery') {
        await onAddDelivery(date, amountKg);
        setKind('consumption'); // deliveries are rare, so the next entry is most likely consumption
      } else {
        await onAddEntry(date, amountKg);
      }
      setAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow">
      <h2 className="px-4 py-3 text-lg font-semibold border-b border-gray-200">Ny inmatning</h2>

      <div className="px-4 pt-4">
        <SegmentedControl
          label="Typ av inmatning"
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
          size="md"
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
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
              className="min-w-0 flex-1 min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40 sm:flex-none"
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor={amountId} className="block text-sm font-medium text-gray-700">
              {unit === 'sacks' ? 'Antal säckar' : 'Mängd (kg)'}
            </label>
            {unit === 'sacks' && isValidAmount && (
              <span className="text-xs text-gray-500 tabular-nums">= {formatKg(amountKg)}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SegmentedControl
              label="Enhet"
              options={UNIT_OPTIONS}
              value={unit}
              onChange={handleUnitChange}
              size="md"
              fullWidth
            />
            <div className="flex gap-2">
              {/* Quick picks fit daily consumption; deliveries are typed in */}
              {kind === 'consumption' && unit === 'sacks' && (
                <SegmentedControl
                  label="Välj antal säckar"
                  options={QUICK_PICKS}
                  value={amount}
                  onChange={setAmount}
                  size="md"
                  fullWidth
                />
              )}
              <input
                id={amountId}
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="1"
                required
                className={`${kind === 'delivery' || unit === 'kg' ? 'flex-1 sm:flex-none' : ''} w-20 min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full min-h-12 sm:min-h-11 sm:w-auto py-2 px-6 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Lägger till...' : kind === 'delivery' ? 'Lägg till påfyllning' : 'Lägg till'}
        </button>
      </div>
    </form>
  );
}
