import React, { useEffect, useRef, useState } from 'react';
import { ChartRange, ChartView, ConsumptionChartManager } from '../lib/ConsumptionChartManager';
import { Entry } from '../types/Entry';
import { DailyTemperature } from '../types/Weather';
import SegmentedControl, { Option } from './SegmentedControl';

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
        <h2 className="text-lg font-semibold">Förbrukning</h2>
        {hasEntries && (
          <div className="flex flex-wrap gap-2">
            <SegmentedControl
              label="Gruppering"
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
            />
            <SegmentedControl
              label="Period"
              options={RANGE_OPTIONS}
              value={range}
              onChange={changeRange}
            />
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
