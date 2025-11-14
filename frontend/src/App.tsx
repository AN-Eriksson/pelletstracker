import React, { useCallback, useEffect, useState } from 'react';
import PelletInputForm from './components/PelletInputForm';
import RecentInputsTable from './components/RecentInputsTable';
import LineChart from './components/LineChart';
import Statistics from './components/Statistics';
import EditEntryModal from './components/EditEntryModal';
import SiteHeader from './components/SiteHeader';
import { Entry } from './types/Entry';
import { AuthManager } from './lib/AuthManager';
import { ApiClient } from './lib/ApiClient';
import LoginForm from './components/LoginForm';

const authManager = new AuthManager();
const api = new ApiClient(authManager);

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false);

  const openEdit = (entry: Entry) => {
    setEntryToEdit(entry);
  };
  const closeEdit = () => {
    setEntryToEdit(null);
  };

  // useEffect(() => {
  //   if (!authManager.isAuthenticated()) {
  //     async () => {
  //       try {
  //         authManager.loginRequest('andreas', '1234');
  //       } catch (err) {
  //         console.error('Login failed', err);
  //       }
  //     };
  //   }
  // }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      await authManager.loginRequest(username, password);
      setIsLoggedIn(true);
      
      await loadAllEntries();
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleSave = async (entry: Entry) => {
    try {
      const id = entry.id;
      const response = await api.put(`/api/pellets/${id}`, entry);

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
      await api.delete(`/api/pellets/${id}`);
      await loadAllEntries();
    } catch (err) {
      console.error(err);
    } finally {
      closeEdit();
    }
  };

  const loadAllEntries = useCallback(async () => {
    try {
      const response = await api.get(`/api/pellets`);

      setEntries(response.data);
    } catch (err) {
      console.error('Failed to load entries', err);
    }
  }, []);

  useEffect(() => {
    loadAllEntries();
  }, [loadAllEntries]);

  const addEntry = async (date: string, numberOfSacks: number) => {
    try {
      const payload = { date, numberOfSacks };
      const response = await api.post('/api/pellets', payload);

      await loadAllEntries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <SiteHeader />

      {!isLoggedIn && (
        <LoginForm onLogin={handleLogin} />
      )} 

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
