import React, { useMemo } from 'react';
import { Delivery } from '../types/Delivery';
import { Entry } from '../types/Entry';
import { FORECAST_WINDOW_DAYS, Inventory, computeInventory } from '../lib/inventory';
import { formatAsSacks, formatKg } from '../lib/units';
import { parseLocalDate } from '../utilities/dateUtils';

interface Props {
  entries: Entry[];
  deliveries: Delivery[];
  onEditDelivery: (delivery: Delivery) => void;
}

// Below this many days left the forecast turns amber as a reminder to order
const ORDER_WARNING_DAYS = 14;
const MAX_DELIVERIES = 3;

const formatDate = (date: string | Date, withYear = false) =>
  parseLocalDate(date).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });

export default function InventoryCard({ entries, deliveries, onEditDelivery }: Props) {
  const inventory = useMemo(() => computeInventory(entries, deliveries), [entries, deliveries]);

  const latestDeliveries = useMemo(
    () => [...deliveries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_DELIVERIES),
    [deliveries],
  );

  return (
    <section className="bg-white rounded shadow">
      <h2 className="px-4 py-3 text-lg font-semibold border-b border-gray-200">Lager</h2>

      {!inventory ? (
        <p className="px-4 py-4 text-sm text-gray-600">
          Registrera en påfyllning för att se lagersaldo och när pelletsen tar slut. Börjar du nu,
          lägg in det du har hemma som första påfyllning.
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

          <ul className="divide-y divide-gray-200 border-t border-gray-200">
            {latestDeliveries.map(delivery => (
              <li key={delivery.id}>
                <button
                  type="button"
                  onClick={() => onEditDelivery(delivery)}
                  aria-label={`Redigera påfyllning ${formatDate(delivery.date)}`}
                  className="flex w-full min-h-12 items-center justify-between gap-4 px-4 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="text-gray-600">Påfyllning {formatDate(delivery.date)}</span>
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

          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            Räknat från {formatDate(inventory.since, true)}
            {deliveries.length > MAX_DELIVERIES &&
              ` · visar ${MAX_DELIVERIES} av ${deliveries.length} påfyllningar`}
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
        Lagret är slut enligt loggen. Registrera en påfyllning.
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
