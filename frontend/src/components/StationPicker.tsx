import React, { useEffect, useId, useMemo, useState } from 'react';
import { WeatherStation } from '../types/Weather';
import { sortByDistance } from '../lib/weather';

interface Props {
  currentStationId: number | null;
  loadStations: () => Promise<WeatherStation[]>;
  onSelect: (stationId: number) => Promise<void>;
  onClose: () => void;
}

const MAX_ROWS = 30;

type Position = { latitude: number; longitude: number };
type LocateState = 'idle' | 'locating' | 'failed';

/**
 * Pick an SMHI station, nearest first once the browser shares its position, otherwise by name.
 * Bottom sheet on mobile, centered dialog from sm (like EditEntryModal).
 */
export default function StationPicker({
  currentStationId,
  loadStations,
  onSelect,
  onClose,
}: Props) {
  const titleId = useId();
  const searchId = useId();
  const [stations, setStations] = useState<WeatherStation[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [locate, setLocate] = useState<LocateState>('idle');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    loadStations()
      .then(setStations)
      .catch(() => setLoadFailed(true));
  }, [loadStations]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocate('failed');
      return;
    }
    setLocate('locating');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocate('idle');
      },
      () => setLocate('failed'),
      { maximumAge: 10 * 60 * 1000, timeout: 15000 },
    );
  };

  const rows = useMemo(() => {
    if (!stations) return [];
    const q = query.trim().toLowerCase();
    const matching = q ? stations.filter(s => s.name.toLowerCase().includes(q)) : stations;
    const sorted = position
      ? sortByDistance(matching, position.latitude, position.longitude)
      : matching.map(station => ({ station, km: null as number | null }));
    return sorted.slice(0, MAX_ROWS);
  }, [stations, query, position]);

  const handleSelect = async (stationId: number) => {
    setSavingId(stationId);
    setSaveFailed(false);
    try {
      await onSelect(stationId);
      onClose();
    } catch (err) {
      console.error(err);
      setSaveFailed(true);
    } finally {
      setSavingId(null);
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
      <div className="relative z-10 flex w-full max-h-[90dvh] flex-col bg-white rounded-t-2xl shadow-lg pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:mx-4 sm:rounded-md sm:pb-0">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-2">
          <h3 id={titleId} className="text-lg font-semibold">
            Välj väderstation
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Stäng
          </button>
        </div>

        <div className="space-y-2 px-6 pb-3">
          <button
            type="button"
            onClick={handleLocate}
            disabled={locate === 'locating'}
            className="w-full min-h-11 px-4 rounded-md border border-blue-600 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            {locate === 'locating'
              ? 'Hämtar position…'
              : position
                ? 'Sorterad efter avstånd från dig'
                : 'Visa närmaste stationer'}
          </button>
          {locate === 'failed' && (
            <p className="text-xs text-red-700">
              Kunde inte hämta din position. Sök på en ort i närheten i stället.
            </p>
          )}
          <label htmlFor={searchId} className="sr-only">
            Sök station
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök station, t.ex. Arlanda"
            autoCorrect="off"
            className="w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {saveFailed && (
            <p className="text-xs text-red-700">
              Kunde inte hämta temperaturer från SMHI just nu. Försök igen om en stund.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-200">
          {loadFailed ? (
            <p className="px-6 py-4 text-sm text-red-700">Kunde inte hämta stationer från SMHI.</p>
          ) : !stations ? (
            <p className="px-6 py-4 text-sm text-gray-500">Hämtar stationer…</p>
          ) : rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">Ingen station matchar sökningen.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {rows.map(({ station, km }) => (
                <li key={station.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(station.id)}
                    disabled={savingId !== null}
                    className="flex w-full min-h-12 items-center justify-between gap-4 px-6 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
                  >
                    <span>
                      {station.name}
                      {station.id === currentStationId && (
                        <span className="ml-2 text-xs font-medium text-blue-700">Vald</span>
                      )}
                    </span>
                    <span className="shrink-0 text-gray-500 tabular-nums">
                      {savingId === station.id
                        ? 'Hämtar temperaturer…'
                        : km !== null
                          ? `${Math.round(km)} km`
                          : ''}
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
