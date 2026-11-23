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
import { CurrentUser, LoginOptions } from './types/Auth';
import { AuthManager } from './lib/AuthManager';
import { ApiClient } from './lib/ApiClient';
import LoginForm from './components/LoginForm';
import Toast, { Notice } from './components/Toast';
import { errorMessage, errorStatus } from './lib/errors';

const authManager = new AuthManager();

// The backend sends a failed GitHub login back to /?login=<reason> (GitHubLoginFailureHandler)
const GITHUB_LOGIN_ERRORS: Record<string, string> = {
  avbruten: 'Inloggningen med GitHub avbröts.',
  fullt: 'Det går inte att skapa nya konton just nu. Försök igen senare.',
  fel: 'Inloggningen med GitHub misslyckades. Försök igen.',
};

/** Reads ?login=… once and removes it, so a reload does not show the message again */
function takeGitHubLoginError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('login');
  if (reason === null) {
    return null;
  }
  params.delete('login');
  const query = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
  return GITHUB_LOGIN_ERRORS[reason] ?? GITHUB_LOGIN_ERRORS.fel;
}

// Once, when the page loads (not in a useState initializer, which StrictMode runs twice)
const gitHubLoginError = takeGitHubLoginError();

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryToEdit, setDeliveryToEdit] = useState<Delivery | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null);
  const [temperatures, setTemperatures] = useState<DailyTemperature[]>([]);
  const [isStationPickerOpen, setIsStationPickerOpen] = useState(false);
  // undefined until the backend has answered whether the session cookie is still logged in
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const isLoggedIn = user === undefined ? null : user !== null;
  const [loginOptions, setLoginOptions] = useState<LoginOptions | null>(null);
  // Shown on the login screen until someone logs in, not again after a later logout
  const [loginError, setLoginError] = useState(gitHubLoginError);

  useEffect(() => {
    authManager.setOnAuthChange(setUser);
    // Both before the first render, so the login screen does not change shape after it appears
    Promise.all([authManager.checkSession(), authManager.loginOptions()]).then(
      ([currentUser, options]) => {
        setLoginOptions(options);
        setUser(currentUser);
      },
    );
    return () => {
      authManager.setOnAuthChange(undefined);
    };
  }, []);

  const [notice, setNotice] = useState<Notice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  // A 401 means the session ended on the server (timed out or logged out elsewhere)
  const api = useMemo(
    () =>
      new ApiClient({
        onUnauthorized: () => {
          authManager.sessionExpired();
          setNotice({ kind: 'info', message: 'Du har loggats ut. Logga in igen.' });
        },
      }),
    [],
  );

  // Logs the error and tells the user. 401 is skipped: onUnauthorized above already explains it
  const showError = useCallback((err: unknown, action: string, retry?: () => void) => {
    console.error(`Failed to ${action}`, err);
    if (errorStatus(err) === 401) {
      return;
    }
    setNotice({
      kind: 'error',
      message: errorMessage(err, action),
      action: retry ? { label: 'Försök igen', onClick: retry } : undefined,
    });
  }, []);

  const openEdit = (entry: Entry) => {
    setEntryToEdit(entry);
  };
  const closeEdit = () => {
    setEntryToEdit(null);
  };

  // Data is loaded by the effect on isLoggedIn
  const handleLogin = async (username: string, password: string) => {
    try {
      await authManager.loginRequest(username, password);
      setNotice(null);
    } catch (err) {
      console.error('Login failed', err);
      throw err; // rethrow so LoginForm can show it
    }
  };

  const handleLogout = async () => {
    try {
      await authManager.logOut();
      setNotice(null);
    } catch (err) {
      showError(err, 'logga ut', handleLogout);
    }
  };

  const clearUserData = () => {
    setEntries([]);
    setEntryToEdit(null);
    setDeliveries([]);
    setDeliveryToEdit(null);
    setIsInventoryOpen(false);
    setWeatherSettings(null);
    setTemperatures([]);
    setIsStationPickerOpen(false);
  };

  // fetch* throw, load* report the error themselves
  const fetchEntries = useCallback(async () => {
    const response = await api.get(`/api/pellets`);
    setEntries(response.data);
  }, [api]);

  const fetchDeliveries = useCallback(async () => {
    const response = await api.get(`/api/deliveries`);
    setDeliveries(response.data);
  }, [api]);

  const fetchWeather = useCallback(async () => {
    const [settings, temps] = await Promise.all([
      api.get(`/api/weather/settings`),
      api.get(`/api/weather/temperatures`),
    ]);
    setWeatherSettings(settings.data);
    setTemperatures(temps.data);
  }, [api]);

  const loadAllEntries = useCallback(async () => {
    try {
      await fetchEntries();
    } catch (err) {
      showError(err, 'hämta förbrukningen', loadAllEntries);
    }
  }, [fetchEntries, showError]);

  const loadAllDeliveries = useCallback(async () => {
    try {
      await fetchDeliveries();
    } catch (err) {
      showError(err, 'hämta lagret', loadAllDeliveries);
    }
  }, [fetchDeliveries, showError]);

  const loadWeather = useCallback(async () => {
    try {
      await fetchWeather();
    } catch (err) {
      showError(err, 'hämta väderdata', loadWeather);
    }
  }, [fetchWeather, showError]);

  // One message (and one retry for everything) when the server is down, instead of three in a row
  const loadEverything = useCallback(async () => {
    const results = await Promise.allSettled([fetchEntries(), fetchDeliveries(), fetchWeather()]);
    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failed) {
      showError(failed.reason, 'hämta dina uppgifter', loadEverything);
    }
  }, [fetchEntries, fetchDeliveries, fetchWeather, showError]);

  const loadStations = useCallback(async (): Promise<WeatherStation[]> => {
    const response = await api.get(`/api/weather/stations`);
    return response.data;
  }, [api]);

  // Rethrows so StationPicker can tell the user (e.g. SMHI unreachable, 502)
  const selectStation = async (stationId: number) => {
    await api.put('/api/weather/station', { stationId });
    await loadWeather();
  };

  // Load everything once logged in, drop it again on logout or when the session ends
  useEffect(() => {
    if (isLoggedIn) {
      setLoginError(null);
      loadEverything();
    } else if (isLoggedIn === false) {
      clearUserData();
    }
  }, [isLoggedIn, loadEverything]);

  // The edit dialogs stay open on errors so nothing typed is lost. A 404 means the post was removed
  // elsewhere: close and reload so the list no longer shows it
  const handleSave = async (entry: Entry) => {
    try {
      await api.put(`/api/pellets/${entry.id}`, entry);
      closeEdit();
      await loadAllEntries();
    } catch (err) {
      if (errorStatus(err) === 409) {
        console.error('Failed to save entry', err);
        setNotice({
          kind: 'error',
          message: 'Det finns redan en förbrukning för det datumet. Ändra den i stället.',
        });
        return;
      }
      showError(err, 'spara förbrukningen');
      if (errorStatus(err) === 404) {
        closeEdit();
        await loadAllEntries();
      }
    }
  };

  const handleDelete = async (entry: Entry) => {
    try {
      await api.delete(`/api/pellets/${entry.id}`);
      closeEdit();
      await loadAllEntries();
    } catch (err) {
      showError(err, 'ta bort förbrukningen');
      if (errorStatus(err) === 404) {
        closeEdit();
        await loadAllEntries();
      }
    }
  };

  const addDelivery = async (date: string, amountKg: number) => {
    try {
      await api.post('/api/deliveries', { date, amountKg });
    } catch (err) {
      showError(err, 'spara påfyllningen');
      throw err; // rethrow so InventorySheet keeps the input
    }
    await loadAllDeliveries();
  };

  const handleSaveDelivery = async (delivery: Delivery) => {
    try {
      await api.put(`/api/deliveries/${delivery.id}`, delivery);
      setDeliveryToEdit(null);
      await loadAllDeliveries();
    } catch (err) {
      showError(err, 'spara påfyllningen');
      if (errorStatus(err) === 404) {
        setDeliveryToEdit(null);
        await loadAllDeliveries();
      }
    }
  };

  const handleDeleteDelivery = async (delivery: Delivery) => {
    try {
      await api.delete(`/api/deliveries/${delivery.id}`);
      setDeliveryToEdit(null);
      await loadAllDeliveries();
    } catch (err) {
      showError(err, 'ta bort påfyllningen');
      if (errorStatus(err) === 404) {
        setDeliveryToEdit(null);
        await loadAllDeliveries();
      }
    }
  };

  const addEntry = async (date: string, amountKg: number) => {
    try {
      await api.post('/api/pellets', { date, amountKg });
    } catch (err) {
      showError(err, 'spara förbrukningen');
      throw err; // rethrow so PelletInputForm keeps the input
    }
    await loadAllEntries();
  };

  // Nothing until /auth/me has answered, so neither the login screen nor the app flashes by
  if (isLoggedIn === null) {
    return null;
  }

  // The login screen has its own full-screen layout, without the app's header
  if (isLoggedIn === false) {
    return (
      <>
        <Toast notice={notice} onDismiss={dismissNotice} />
        <LoginForm onLogin={handleLogin} options={loginOptions} initialError={loginError} />
      </>
    );
  }

  return (
    // Mobile: cards straight on the page background. From sm: the whole app sits in one white card
    <div className="max-w-4xl mx-auto p-4 pb-8 sm:my-6 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow-md">
      <Toast notice={notice} onDismiss={dismissNotice} />
      <SiteHeader displayName={user?.displayName} onLogout={handleLogout} />

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
    </div>
  );
}
