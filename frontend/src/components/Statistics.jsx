import React, { useMemo } from 'react';

const toDateStart = d => {
  const date = typeof d === 'string' ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const sumSince = (entries, days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1); // include today
  cutoff.setHours(0, 0, 0, 0);
  return entries.reduce((acc, e) => {
    const ed = toDateStart(e.date);
    return ed >= cutoff ? acc + Number(e.numberOfSacks || 0) : acc;
  }, 0);
};

const sumSinceDate = (entries, fromDate) => {
  const cutoff = toDateStart(fromDate);
  return entries.reduce((acc, e) => {
    const ed = toDateStart(e.date);
    return ed >= cutoff ? acc + Number(e.numberOfSacks || 0) : acc;
  }, 0);
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // convert so Monday=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export default function Statistics({ entries = [] }) {
  const stats = useMemo(() => {
    const total30 = sumSince(entries, 30);
    const total14 = sumSince(entries, 14);
    const total7 = sumSince(entries, 7);
    const total3 = sumSince(entries, 3);
    const avg30 = +(total30 / 30).toFixed(2);
    const avg14 = +(total14 / 14).toFixed(2);
    const avg7 = +(total7 / 7).toFixed(2);
    const avg3 = +(total3 / 3).toFixed(2);
    const weekTotal = sumSinceDate(entries, startOfWeek());
    const overallTotal = entries.reduce((acc, e) => acc + Number(e.numberOfSacks || 0), 0);
    return { total30, total14, total7, total3, avg30, avg14, avg7, avg3, weekTotal, overallTotal };
  }, [entries]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="p-4 bg-white rounded shadow">
        <div className="text-xs text-gray-500">Denna vecka</div>
        <div className="text-2xl font-bold">{stats.weekTotal}</div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <div className="text-xs text-gray-500">Snitt (30 dgr)</div>
        <div className="text-2xl font-bold">{stats.avg30}</div>
        <div className="text-xs text-gray-400">Totalt: {stats.total30}</div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <div className="text-xs text-gray-500">Snitt (14 dgr)</div>
        <div className="text-2xl font-bold">{stats.avg14}</div>
        <div className="text-xs text-gray-400">Totalt: {stats.total14}</div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <div className="text-xs text-gray-500">Snitt (7 / 3 dgr)</div>
        <div className="text-2xl font-bold">
          {stats.avg7} / {stats.avg3}
        </div>
        <div className="text-xs text-gray-400">
          Totalt: {stats.total7} / {stats.total3}
        </div>
      </div>
    </div>
  );
}
