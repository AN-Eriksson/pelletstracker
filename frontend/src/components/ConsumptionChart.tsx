import React, { useEffect, useRef, useState } from 'react';
import { ChartRange, ChartView, ConsumptionChartManager } from '../lib/ConsumptionChartManager';
import { Entry } from '../types/Entry';
import { DailyTemperature } from '../types/Weather';
import SegmentedControl, { Option } from './SegmentedControl';
import { parseLocalDate } from '../utilities/dateUtils';

type Props = {
  entries?: Entry[];
  temperatures?: DailyTemperature[];
};

const VIEW_OPTIONS: Option<ChartView>[] = [
  { value: 'day', label: 'Dag' },
  { value: 'week', label: 'Vecka' },
  { value: 'month', label: 'Månad' },
];

const RANGE_OPTIONS: Option<ChartRange>[] = [
  { value: '30d', label: '30 dagar' },
  { value: '3m', label: '3 mån' },
  { value: '1y', label: '1 år' },
  { value: 'all', label: 'Allt' },
];

// Picking a period also picks a grouping that gives a readable number of bars (about 13–60).
// The grouping can still be changed afterwards
const VIEW_FOR_RANGE: Record<ChartRange, ChartView> = {
  '30d': 'day',
  '3m': 'week',
  '1y': 'week',
  all: 'month',
};

const ARIA_LABEL: Record<ChartView, string> = {
  day: 'Förbrukning i kg per dag',
  week: 'Förbrukning i kg per vecka',
  month: 'Förbrukning i kg per månad',
};

const BAR_UNIT: Record<ChartView, string> = { day: 'en dag', week: 'en vecka', month: 'en månad' };

const RANGE_TEXT: Record<Exclude<ChartRange, 'all'>, string> = {
  '30d': 'de senaste 30 dagarna',
  '3m': 'de senaste 3 månaderna',
  '1y': 'det senaste året',
};

// E.g. "Varje stapel är en månad, sedan sep. 2021"
const describe = (view: ChartView, range: ChartRange, entries: Entry[]): string => {
  let period: string;
  if (range === 'all') {
    const first = entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date);
    const since = parseLocalDate(first).toLocaleDateString('sv-SE', {
      month: 'short',
      year: 'numeric',
    });
    period = `sedan ${since}`;
  } else {
    period = RANGE_TEXT[range];
  }
  return `Varje stapel är ${BAR_UNIT[view]}, ${period}`;
};

export default function ConsumptionChart({ entries = [], temperatures = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ChartView>('week');
  const [range, setRange] = useState<ChartRange>('3m');
  const hasEntries = entries.length > 0;

  const changeRange = (next: ChartRange) => {
    setRange(next);
    setView(VIEW_FOR_RANGE[next]);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new ConsumptionChartManager(canvasRef.current);
    manager.render(entries, view, range, temperatures);
    return () => manager.destroy();
  }, [entries, view, range, temperatures]);

  return (
    <div className="bg-white rounded shadow">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold">Förbrukning</h2>
          {hasEntries && <p className="text-sm text-gray-500">{describe(view, range, entries)}</p>}
        </div>
        {hasEntries && (
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500" aria-hidden="true">
                En stapel per
              </span>
              <SegmentedControl
                label="En stapel per"
                options={VIEW_OPTIONS}
                value={view}
                onChange={setView}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500" aria-hidden="true">
                Tidsperiod
              </span>
              <SegmentedControl
                label="Tidsperiod"
                options={RANGE_OPTIONS}
                value={range}
                onChange={changeRange}
              />
            </div>
          </div>
        )}
      </div>

      {hasEntries ? (
        <div className="relative h-64 sm:h-80 p-4">
          <canvas ref={canvasRef} role="img" aria-label={ARIA_LABEL[view]} />
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-gray-500">Inga poster ännu</div>
      )}
    </div>
  );
}
