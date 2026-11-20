import React, { useId, useMemo, useState } from 'react';
import AmountInput from './AmountInput';
import { Delivery } from '../types/Delivery';
import { Unit, amountToKg, formatKg } from '../lib/units';
import { parseLocalDate, stripTimeFromDate } from '../utilities/dateUtils';

interface Props {
  deliveries: Delivery[];
  onAddDelivery: (date: string, amountKg: number) => Promise<void>;
  onEditDelivery: (delivery: Delivery) => void;
  onClose: () => void;
}

const formatDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * Manage the stock: add a delivery, and list all deliveries for editing.
 * Bottom sheet on mobile, centered dialog from sm (like EditEntryModal).
 */
export default function InventorySheet({
  deliveries,
  onAddDelivery,
  onEditDelivery,
  onClose,
}: Props) {
  const titleId = useId();
  const dateId = useId();
  const today = stripTimeFromDate(new Date());
  const [date, setDate] = useState(today);
  const [unit, setUnit] = useState<Unit>('sacks');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const sortedDeliveries = useMemo(
    () => [...deliveries].sort((a, b) => b.date.localeCompare(a.date)),
    [deliveries],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amountKg = amountToKg(amount, unit);
    if (!date || amountKg === null) {
      return;
    }

    try {
      setLoading(true);
      await onAddDelivery(date, amountKg);
      setAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90dvh] overflow-y-auto bg-white rounded-t-2xl shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md sm:mx-4 sm:rounded-md sm:pb-0">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-2">
          <h3 id={titleId} className="text-lg font-semibold">
            Lager
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Stäng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <h4 className="text-sm font-semibold text-gray-900">Ny påfyllning</h4>

          <div>
            <label htmlFor={dateId} className="block text-sm font-medium text-gray-700 mb-1">
              Datum
            </label>
            <input
              id={dateId}
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <AmountInput
            unit={unit}
            onUnitChange={setUnit}
            amount={amount}
            onAmountChange={setAmount}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full min-h-12 py-2 px-6 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Lägger till...' : 'Lägg till påfyllning'}
          </button>
        </form>

        <div className="border-t border-gray-200">
          <h4 className="px-6 pt-4 pb-2 text-sm font-semibold text-gray-900">Påfyllningar</h4>
          {sortedDeliveries.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-gray-500">Inga påfyllningar ännu</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sortedDeliveries.map(delivery => (
                <li key={delivery.id}>
                  <button
                    type="button"
                    onClick={() => onEditDelivery(delivery)}
                    aria-label={`Redigera påfyllning ${formatDate(delivery.date)}`}
                    className="flex w-full min-h-12 items-center justify-between gap-4 px-6 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100"
                  >
                    <span className="text-gray-700">{formatDate(delivery.date)}</span>
                    <span className="flex items-center gap-3 tabular-nums">
                      +{formatKg(delivery.amountKg)}
                      <span aria-hidden="true" className="text-xl text-gray-400">
                        ›
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
