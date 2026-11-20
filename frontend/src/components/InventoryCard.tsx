import React, { useId, useMemo, useState } from 'react';
import { HelpButton, HelpText } from './HelpButton';
import { Delivery } from '../types/Delivery';
import { Entry } from '../types/Entry';
import { FORECAST_WINDOW_DAYS, Inventory, computeInventory } from '../lib/inventory';
import { formatAsSacks, formatKg } from '../lib/units';
import { parseLocalDate } from '../utilities/dateUtils';

interface Props {
  entries: Entry[];
  deliveries: Delivery[];
  onEdit: () => void;
}

// Below this many days left the forecast turns amber as a reminder to order
const ORDER_WARNING_DAYS = 14;

const formatDate = (date: string | Date, withYear = false) =>
  parseLocalDate(date).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });

export default function InventoryCard({ entries, deliveries, onEdit }: Props) {
  const inventory = useMemo(() => computeInventory(entries, deliveries), [entries, deliveries]);
  const helpId = useId();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <section className="bg-white rounded shadow">
      <div className="flex items-center justify-between gap-4 px-4 py-1 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-semibold">Lager</h2>
          <HelpButton
            label="Vad är lager?"
            expanded={showHelp}
            onToggle={() => setShowHelp(prev => !prev)}
            controls={helpId}
          />
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
        >
          Redigera
        </button>
      </div>
      <HelpText id={helpId} hidden={!showHelp}>
        Pellets du har hemma. Lägg till varje leverans under Redigera, och första gången det du
        redan har. Saldot är alla påfyllningar minus förbrukningen sedan första påfyllningen.
        Prognosen räknar med snittet för de senaste {FORECAST_WINDOW_DAYS} dagarna.
      </HelpText>

      {!inventory ? (
        <p className="px-4 py-4 text-sm text-gray-600">
          Lägg till en påfyllning under Redigera för att se lagersaldo och när pelletsen tar slut.
          Börjar du nu, lägg in det du har hemma som första påfyllning.
        </p>
      ) : (
        <>
          <div className="px-4 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-3xl font-bold tabular-nums">
                {formatKg(Math.max(inventory.balanceKg, 0), 0)}
              </div>
              {inventory.balanceKg > 0 && (
                <div className="text-sm text-gray-500 tabular-nums">
                  {formatAsSacks(inventory.balanceKg)}
                </div>
              )}
            </div>

            <Forecast inventory={inventory} />
          </div>

          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            Räknat från {formatDate(inventory.since, true)} · {deliveries.length}{' '}
            {deliveries.length === 1 ? 'påfyllning' : 'påfyllningar'}
          </div>
        </>
      )}
    </section>
  );
}

function Forecast({ inventory }: { inventory: Inventory }) {
  if (inventory.balanceKg <= 0) {
    return (
      <p className="mt-2 text-sm font-medium text-red-700">
        Lagret är slut enligt loggen. Lägg till en påfyllning.
      </p>
    );
  }

  if (inventory.daysLeft === null || !inventory.emptyDate || inventory.dailyAverageKg === null) {
    return (
      <p className="mt-2 text-sm text-gray-600">
        Ingen förbrukning de senaste {FORECAST_WINDOW_DAYS} dagarna att göra en prognos på.
      </p>
    );
  }

  const warn = inventory.daysLeft <= ORDER_WARNING_DAYS;
  return (
    <div className="mt-2 text-sm">
      <p className={warn ? 'font-medium text-amber-700' : 'text-gray-700'}>
        {warn ? 'Dags att beställa – räcker' : 'Räcker'} till ca {formatDate(inventory.emptyDate)} (
        {inventory.daysLeft} {inventory.daysLeft === 1 ? 'dag' : 'dagar'})
      </p>
      <p className="text-xs text-gray-500">
        Snitt {formatKg(inventory.dailyAverageKg)}/dag de senaste {FORECAST_WINDOW_DAYS} dagarna
      </p>
    </div>
  );
}
