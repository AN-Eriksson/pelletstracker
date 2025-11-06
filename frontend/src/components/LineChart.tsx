import React, { useEffect, useRef } from 'react';
import { LineChartManager } from '../lib/LineChartManager.js';
import { Entry } from '../types/Entry.js';

type Props = {
  entries?: Entry[];
};

export default function LineChart({ entries = [] }: Props) {
  const canvasIdRef = useRef<string>(`linechart-${Math.random().toString(36).slice(2, 9)}`);
  const managerRef = useRef<LineChartManager | null>(null);

  useEffect(() => {
    managerRef.current = new LineChartManager(canvasIdRef.current);
    managerRef.current.createChart(entries);
    return () => {
      managerRef.current?.destroy();
    };
  }, [entries]);

  useEffect(() => {
    managerRef.current?.updateChart(entries);
  }, [entries]);

  return (
    <div className="mt-6">
      <canvas id={canvasIdRef.current} />
    </div>
  );
}
