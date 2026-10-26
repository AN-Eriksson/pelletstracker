import React, { useEffect, useRef, useState } from 'react';
import { ChartRange, ChartView, ConsumptionChartManager } from '../lib/ConsumptionChartManager';
import { Entry } from '../types/Entry';
import SegmentedControl, { Option } from './SegmentedControl';

type Props = {
  entries?: Entry[];
};

const VIEW_OPTIONS: Option<ChartView>[] = [
  { value: 'week', label: 'Vecka' },
  { value: 'day', label: 'Dag' },
];

const RANGE_OPTIONS: Option<ChartRange>[] = [
  { value: '30d', label: '30 dagar' },
  { value: '3m', label: '3 mån' },
  { value: 'all', label: 'Allt' },
];

export default function ConsumptionChart({ entries = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ChartView>('week');
  const [range, setRange] = useState<ChartRange>('3m');
  const hasEntries = entries.length > 0;

  useEffect(() => {
    if (!canvasRef.current) return;

    const manager = new ConsumptionChartManager(canvasRef.current);
    manager.render(entries, view, range);
    return () => manager.destroy();
  }, [entries, view, range]);

  return (
    <div className="mt-6 bg-white rounded shadow">
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
              onChange={setRange}
            />
          </div>
        )}
      </div>

      {hasEntries ? (
        <div className="relative h-64 sm:h-80 p-4">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={view === 'week' ? 'Säckar per vecka' : 'Säckar per dag'}
          />
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-gray-500">Inga poster ännu</div>
      )}
    </div>
  );
}
