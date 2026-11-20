export type WeatherStation = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

// Daily mean air temperature at the user's SMHI station
export type DailyTemperature = {
  date: string;
  meanC: number;
};

export type WeatherSettings = {
  stationId: number | null;
  stationName: string | null;
};
