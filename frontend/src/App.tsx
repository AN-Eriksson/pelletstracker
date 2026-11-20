import React, { useCallback, useEffect, useState, useMemo } from 'react';
import PelletInputForm from './components/PelletInputForm';
import RecentInputsTable from './components/RecentInputsTable';
import ConsumptionChart from './components/ConsumptionChart';
import Statistics from './components/Statistics';
import EditEntryModal from './components/EditEntryModal';
import SiteHeader from './components/SiteHeader';
import InventoryCard from './components/InventoryCard';
import InventorySheet from './components/InventorySheet';
import WeatherCard from './components/WeatherCard';
import StationPicker from './components/StationPicker';
import { Entry } from './types/Entry';
import { Delivery } from './types/Delivery';
import { DailyTemperature, WeatherSettings, WeatherStation } from './types/Weather';
import { AuthManager } from './lib/AuthManager';
import { ApiClient } from './lib/ApiClient';
import LoginForm from './components/LoginForm';

const authManager = new AuthManager();

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryToEdit, setDeliveryToEdit] = useState<Delivery | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null);
  const [temperatures, setTemperatures] = useState<DailyTemperature[]>([]);
  const [isStationPickerOpen, setIsStationPickerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(authManager.isAuthenticated());

  useEffect(() => {
    authManager.setOnAuthChange(setIsLoggedIn);
    return () => {
      authManager.setOnAuthChange(undefined);
    };
  }, [setIsLoggedIn]);

  // create api client after registration (or useMemo)
  const api = useMemo(
    () => new ApiClient(authManager, { onUnauthorized: () => authManager.logOut() }),
    [],
  );

  const openEdit = (entry: Entry) => {
    setEntryToEdit(entry);
  };
  const closeEdit = () => {
    setEntryToEdit(null);
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      await authManager.loginRequest(username, password);
      setIsLoggedIn(true);

      await Promise.all([loadAllEntries(), loadAllDeliveries(), loadWeather()]);
    } catch (err) {
      console.error('Login failed', err);
      throw err; // rethrow so LoginForm can show it
    }
  };

  const handleLogout = () => {
    authManager.logOut();
    setEntries([]);
    setEntryToEdit(null);
    setDeliveries([]);
    setDeliveryToEdit(null);
    setIsInventoryOpen(false);
    setWeatherSettings(null);
    setTemperatures([]);
    setIsStationPickerOpen(false);
  };

  const handleSave = async (entry: Entry) => {
    try {
      const id = entry.id;
      const response = await api.put(`/api/pellets/${id}`, entry);

      await loadAllEntries();
    } catch (err) {
      console.error(err);
      if ((err as { status?: number }).status === 409) {
        window.alert('Det finns redan en post för det datumet. Ändra den i stället.');
      }
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

  const loadAllDeliveries = useCallback(async () => {
    try {
      const response = await api.get(`/api/deliveries`);

      setDeliveries(response.data);
    } catch (err) {
      console.error('Failed to load deliveries', err);
    }
  }, []);

  const loadWeather = useCallback(async () => {
    try {
      const [settings, temps] = await Promise.all([
        api.get(`/api/weather/settings`),
        api.get(`/api/weather/temperatures`),
      ]);

      setWeatherSettings(settings.data);
      setTemperatures(temps.data);
    } catch (err) {
      console.error('Failed to load weather', err);
    }
  }, []);

  const loadStations = useCallback(async (): Promise<WeatherStation[]> => {
    const response = await api.get(`/api/weather/stations`);
    return response.data;
  }, []);

  // Rethrows so StationPicker can tell the user (e.g. SMHI unreachable, 502)
  const selectStation = async (stationId: number) => {
    await api.put('/api/weather/station', { stationId });
    await loadWeather();
  };

  useEffect(() => {
    loadAllEntries();
    loadAllDeliveries();
    loadWeather();
  }, [loadAllEntries, loadAllDeliveries, loadWeather]);

  const addDelivery = async (date: string, amountKg: number) => {
    try {
      await api.post('/api/deliveries', { date, amountKg });
      await loadAllDeliveries();
    } catch (err) {
      console.error(err);
      throw err; // rethrow so InventorySheet keeps the input
    }
  };

  const handleSaveDelivery = async (delivery: Delivery) => {
    try {
      await api.put(`/api/deliveries/${delivery.id}`, delivery);
      await loadAllDeliveries();
    } catch (err) {
      console.error(err);
    } finally {
      setDeliveryToEdit(null);
    }
  };

  const handleDeleteDelivery = async (delivery: Delivery) => {
    try {
      await api.delete(`/api/deliveries/${delivery.id}`);
      await loadAllDeliveries();
    } catch (err) {
      console.error(err);
    } finally {
      setDeliveryToEdit(null);
    }
  };

  const addEntry = async (date: string, amountKg: number) => {
    try {
      const payload = { date, amountKg };
      const response = await api.post('/api/pellets', payload);

      await loadAllEntries();
    } catch (err) {
      console.error(err);
      throw err; // rethrow so PelletInputForm keeps the input
    }
  };

  return (
    // Mobile: cards straight on the page background. From sm: the whole app sits in one white card
    <div className="max-w-4xl mx-auto p-4 pb-8 sm:my-6 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow-md">
      <SiteHeader onLogout={isLoggedIn ? handleLogout : undefined} />

      {!isLoggedIn && <LoginForm onLogin={handleLogin} />}

      {isLoggedIn && (
        <main className="space-y-4 sm:space-y-6">
          {/* Most used first: log sacks, then the stock, this week's numbers, weather, the trend and the history */}
          <PelletInputForm onAddEntry={addEntry} />
          <InventoryCard
            entries={entries}
            deliveries={deliveries}
            onEdit={() => setIsInventoryOpen(true)}
          />
          <Statistics entries={entries} />
          <WeatherCard
            entries={entries}
            temperatures={temperatures}
            settings={weatherSettings}
            onPickStation={() => setIsStationPickerOpen(true)}
          />
          <ConsumptionChart entries={entries} temperatures={temperatures} />
          <RecentInputsTable entries={entries} onEdit={openEdit} />

          {entryToEdit && (
            <EditEntryModal
              entry={entryToEdit}
              onClose={closeEdit}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}

          {isStationPickerOpen && (
            <StationPicker
              currentStationId={weatherSettings?.stationId ?? null}
              loadStations={loadStations}
              onSelect={selectStation}
              onClose={() => setIsStationPickerOpen(false)}
            />
          )}

          {isInventoryOpen && (
            <InventorySheet
              deliveries={deliveries}
              onAddDelivery={addDelivery}
              onEditDelivery={setDeliveryToEdit}
              onClose={() => setIsInventoryOpen(false)}
            />
          )}

          {/* Rendered after the sheet so it opens on top of it */}
          {deliveryToEdit && (
            <EditEntryModal
              entry={deliveryToEdit}
              title="Redigera påfyllning"
              onClose={() => setDeliveryToEdit(null)}
              onSave={handleSaveDelivery}
              onDelete={handleDeleteDelivery}
            />
          )}
        </main>
      )}
    </div>
  );
}
