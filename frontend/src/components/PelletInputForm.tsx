import React, { useEffect, useId, useRef, useState } from 'react';
import { stripTimeFromDate } from '../utilities/dateUtils';
import SegmentedControl, { Option } from './SegmentedControl';
import AmountInput from './AmountInput';
import { HelpButton, HelpText } from './HelpButton';
import { Unit, amountToKg } from '../lib/units';

interface Props {
  onAddEntry: (date: string, amountKg: number) => Promise<void>;
}

const todayIso = () => stripTimeFromDate(new Date());

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return stripTimeFromDate(d);
};

export default function PelletInputForm({ onAddEntry }: Props) {
  const dateId = useId();
  const [date, setDate] = useState(todayIso);
  const [unit, setUnit] = useState<Unit>('sacks');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const helpId = useId();
  const [showHelp, setShowHelp] = useState(false);

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

    const amountKg = amountToKg(amount, unit);
    if (!date || amountKg === null) {
      return;
    }

    try {
      setLoading(true);
      await onAddEntry(date, amountKg);
      setAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow">
      <div className="flex items-center gap-1 px-4 py-1 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Ny förbrukning</h2>
        <HelpButton
          label="Vad är förbrukning?"
          expanded={showHelp}
          onToggle={() => setShowHelp(prev => !prev)}
          controls={helpId}
        />
      </div>
      <HelpText id={helpId} hidden={!showHelp}>
        Logga hur mycket pellets du har tagit från lagret, i säckar eller kg. En förbrukning kan
        till exempel vara när du flyttar säckar från pallen (ditt lager) till veckoförrådet som
        matar pannan. Loggar du flera gånger samma dag läggs mängderna ihop. Statistiken, grafen och
        lagerprognosen bygger på det här.
      </HelpText>

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

        <AmountInput
          unit={unit}
          onUnitChange={setUnit}
          amount={amount}
          onAmountChange={setAmount}
          quickPicks
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full min-h-12 sm:min-h-11 sm:w-auto py-2 px-6 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Lägger till...' : 'Lägg till'}
        </button>
      </div>
    </form>
  );
}
