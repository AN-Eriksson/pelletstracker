import React, { useId, useMemo, useState } from 'react';
import { HelpButton, HelpText } from './HelpButton';
import { Entry } from '../types/Entry';
import { DailyTemperature, WeatherSettings } from '../types/Weather';
import { BASE_TEMP_C, COMPARISON_DAYS, DegreeDayPeriod, compareDegreeDays } from '../lib/weather';
import { formatKg } from '../lib/units';
import { parseLocalDate } from '../utilities/dateUtils';

interface Props {
  entries: Entry[];
  temperatures: DailyTemperature[];
  settings: WeatherSettings | null;
  onPickStation: () => void;
}

const shortDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });

const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString('sv-SE', { maximumFractionDigits: digits });

export default function WeatherCard({ entries, temperatures, settings, onPickStation }: Props) {
  const helpId = useId();
  const [showHelp, setShowHelp] = useState(false);
  const { current, previous } = useMemo(
    () => compareDegreeDays(entries, temperatures),
    [entries, temperatures],
  );
  const hasStation = settings?.stationId != null;

  return (
    <section className="bg-white rounded shadow">
      <div className="flex items-center justify-between gap-4 px-4 py-1 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-semibold">Väder</h2>
          <HelpButton
            label="Vad är kg per graddag?"
            expanded={showHelp}
            onToggle={() => setShowHelp(prev => !prev)}
            controls={helpId}
          />
        </div>
        {hasStation && (
          <button
            type="button"
            onClick={onPickStation}
            className="min-h-11 px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Byt station
          </button>
        )}
      </div>
      <HelpText id={helpId} hidden={!showHelp}>
        Graddagar mäter hur kallt det har varit: varje dygn räknas {BASE_TEMP_C} °C minus dygnets
        medeltemperatur, eller 0 om det var varmare. kg per graddag visar hur mycket pellets som går
        åt per kallgrad, så att en mild och en kall period går att jämföra. Lägre är bättre.
        Temperaturerna kommer från SMHI-stationen du har valt och uppdateras varje morgon.
      </HelpText>

      {!hasStation ? (
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Välj en väderstation från SMHI för att jämföra förbrukningen med utetemperaturen.
          </p>
          <button
            type="button"
            onClick={onPickStation}
            className="w-full min-h-11 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 sm:w-auto"
          >
            Välj väderstation
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 py-4">
            {current?.kgPerDegreeDay != null ? (
              <CurrentPeriod current={current} previous={previous} />
            ) : (
              <p className="text-sm text-gray-600">
                {current
                  ? 'Det har varit för varmt för en jämförelse de senaste veckorna.'
                  : `Behöver minst två veckors förbrukning och temperaturer för en jämförelse.`}
              </p>
            )}
          </div>
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            SMHI {settings?.stationName ?? `station ${settings?.stationId}`}
          </div>
        </>
      )}
    </section>
  );
}

function CurrentPeriod({
  current,
  previous,
}: {
  current: DegreeDayPeriod;
  previous: DegreeDayPeriod | null;
}) {
  const change =
    previous?.kgPerDegreeDay && current.kgPerDegreeDay
      ? (current.kgPerDegreeDay - previous.kgPerDegreeDay) / previous.kgPerDegreeDay
      : null;

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">
          {formatNumber(current.kgPerDegreeDay ?? 0, 2)}
        </span>
        <span className="text-sm text-gray-600">kg per graddag</span>
      </div>
      <p className="mt-1 text-sm text-gray-700">
        {shortDate(current.from)} – {shortDate(current.to)}: {formatKg(current.kg, 0)} på{' '}
        {formatNumber(current.degreeDays, 0)} graddagar, snitt {formatNumber(current.meanC)} °C
      </p>
      {previous?.kgPerDegreeDay != null && (
        <p className="mt-1 text-xs text-gray-500">
          Föregående {COMPARISON_DAYS / 7} veckor: {formatNumber(previous.kgPerDegreeDay, 2)} kg per
          graddag
          {change !== null && ` (${change > 0 ? '+' : ''}${formatNumber(change * 100, 0)} %)`}
        </p>
      )}
    </>
  );
}
