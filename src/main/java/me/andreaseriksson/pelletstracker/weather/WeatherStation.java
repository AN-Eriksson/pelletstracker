package me.andreaseriksson.pelletstracker.weather;

/**
 * An active SMHI station that reports daily mean air temperature.
 */
public record WeatherStation(int id, String name, double latitude, double longitude) {
}
