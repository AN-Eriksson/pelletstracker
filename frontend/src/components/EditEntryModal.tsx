import React, { useState, useEffect, useId } from 'react';
import { Entry } from '../types/Entry';
import { formatAsSacks } from '../lib/units';

interface Props {
  entry: Entry,
  onClose: () => void,
  onSave: (entry: Entry) => Promise<void>,
  onDelete: (entry: Entry) => Promise<void>
}

const EditEntryModal = ({ entry, onClose, onSave, onDelete }: Props) => {
  const titleId = useId();
  const [date, setDate] = useState('');
  const [amountKg, setAmountKg] = useState('');

  const toInputDate = (date?: string | Date): string => {
    if (!date) {
      return '';
    }

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const dateObject = new Date(date);
    return `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(
      dateObject.getDate(),
    ).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!entry) {
      setDate('');
      setAmountKg('');
      return;
    }

    setDate(toInputDate(entry.date));
    setAmountKg(String(entry.amountKg ?? ''));
  }, [entry]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave({
      ...entry,
      date,
      amountKg: Number(amountKg) || 0,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!entry) return;
    if (!window.confirm('Ta bort posten?')) return;

    onDelete(entry);
    onClose();
  };

  return (
    // Bottom sheet on mobile (stays reachable above the keyboard), centered dialog from sm
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-h-[90dvh] overflow-y-auto bg-white rounded-t-2xl shadow-lg p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:mx-4 sm:rounded-md sm:pb-6"
      >
        <h3 id={titleId} className="text-lg font-semibold mb-4">
          Redigera post
        </h3>

        <label className="block mb-3">
          <div className="text-xs text-gray-600 mb-1">Datum</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full min-h-11 bg-white border border-gray-300 rounded px-3 py-2"
            required
          />
        </label>

        <label className="block mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Mängd (kg)</span>
            {Number(amountKg) > 0 && (
              <span className="tabular-nums">{formatAsSacks(Number(amountKg))}</span>
            )}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={amountKg}
            onChange={e => setAmountKg(e.target.value)}
            className="w-full min-h-11 bg-white border border-gray-300 rounded px-3 py-2"
            required
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 min-h-11 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 sm:flex-none"
            >
              Spara
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-11 border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 sm:flex-none"
            >
              Avbryt
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="min-h-11 text-red-600 border border-red-600 px-3 py-2 rounded hover:bg-red-50 sm:min-h-0 sm:py-1"
          >
            Ta bort
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEntryModal;
