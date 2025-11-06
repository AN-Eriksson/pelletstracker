import React, { useCallback, useEffect, useState } from 'react';
import PelletInputForm from './components/PelletInputForm';
import RecentInputsTable from './components/RecentInputsTable';
import LineChart from './components/LineChart';
import Statistics from './components/Statistics';
import EditEntryModal from './components/EditEntryModal';
import SiteHeader from './components/SiteHeader';
import { Entry } from './types/Entry';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

  const openEdit = (entry: Entry) => {
    setEntryToEdit(entry);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEntryToEdit(null);
  };

  const handleSave = async (entry: Entry) => {
    try {
      const id = entry.id;
      await fetch(`/api/pellets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      await loadAllEntries();
    } catch (err) {
      console.error(err);
    } finally {
      closeEdit();
    }
  };

  const handleDelete = async (entry: Entry) => {
    try {
      const id = entry.id;
      await fetch(`/api/pellets/${id}`, { method: 'DELETE' });
      await loadAllEntries();
    } catch (err) {
      console.error(err);
    } finally {
      closeEdit();
    }
  };

  const loadAllEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/pellets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setEntries(json?.data ?? json ?? []);
    } catch (err) {
      console.error('Failed to load entries', err);
    }
  }, []);

  useEffect(() => {
    loadAllEntries();
  }, [loadAllEntries]);

  const addEntry = async (date: string, numberOfSacks: number) => {
    try {
      const res = await fetch('/api/pellets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, numberOfSacks }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      await loadAllEntries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <SiteHeader />

      <PelletInputForm onAddEntry={addEntry} />

      <RecentInputsTable entries={entries} onEdit={openEdit} />

      {entryToEdit && (
        <EditEntryModal
          isOpen={editOpen}
          entry={entryToEdit}
          onClose={closeEdit}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      <Statistics entries={entries} />

      <LineChart entries={entries} />
    </div>
  );
}
