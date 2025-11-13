import React, { useCallback, useEffect, useState } from 'react';
import PelletInputForm from './components/PelletInputForm';
import RecentInputsTable from './components/RecentInputsTable';
import LineChart from './components/LineChart';
import Statistics from './components/Statistics';
import EditEntryModal from './components/EditEntryModal';
import SiteHeader from './components/SiteHeader';
import { Entry } from './types/Entry';
import { AuthManager } from './lib/AuthManager';

const authManager = new AuthManager();

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

  const openEdit = (entry: Entry) => {
    setEntryToEdit(entry);
  };
  const closeEdit = () => {
    setEntryToEdit(null);
  };

  useEffect(() => {
    const authManager = new AuthManager();
    authManager.loginRequest('andreas', '1234');
  });

  const handleSave = async (entry: Entry) => {
    try {
      const token = authManager.getToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authManager.getAuthHeader() as Record<string, string>),
      };
      const id = entry.id;
      await fetch(`/api/pellets/${id}`, {
        method: 'PUT',
        headers,
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
