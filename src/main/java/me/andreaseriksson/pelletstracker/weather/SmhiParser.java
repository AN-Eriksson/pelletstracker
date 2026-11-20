package me.andreaseriksson.pelletstracker.weather;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Parses SMHI Open Data responses for metobs parameter 2 (daily mean air temperature).
 * Kept free of HTTP so the formats can be unit tested.
 */
final class SmhiParser {

    private SmhiParser() {}

    /**
     * Active stations from {@code parameter/2.json}, sorted by name.
     */
    static List<WeatherStation> parseStations(JsonNode root) {
        List<WeatherStation> stations = new ArrayList<>();
        for (JsonNode station : root.path("station")) {
            if (!station.path("active").asBoolean(false)) {
                continue;
            }
            stations.add(new WeatherStation(
                    station.path("id").asInt(),
                    station.path("name").asText(),
                    station.path("latitude").asDouble(),
                    station.path("longitude").asDouble()));
        }
        stations.sort(Comparator.comparing(WeatherStation::name));
        return stations;
    }

    /**
     * Values from {@code period/latest-months/data.json}. Each value has {@code ref} (the day, YYYY-MM-DD)
     * and {@code value} (degrees as a string); values that cannot be read are skipped.
     */
    static List<DailyTemperature> parseLatestMonths(int stationId, JsonNode root) {
        List<DailyTemperature> temperatures = new ArrayList<>();
        for (JsonNode value : root.path("value")) {
            try {
                LocalDate date = LocalDate.parse(value.path("ref").asText());
                double meanC = Double.parseDouble(value.path("value").asText());
                temperatures.add(new DailyTemperature(stationId, date, meanC));
            } catch (DateTimeParseException | NumberFormatException e) {
                // missing or malformed value for that day
            }
        }
        return temperatures;
    }

    /**
     * Rows from {@code period/corrected-archive/data.csv}: a few metadata blocks, then a header starting
     * with "Från Datum Tid" and rows {@code from;to;day;value;quality;;...}. Only days on or after
     * {@code from} are returned.
     */
    static List<DailyTemperature> parseArchiveCsv(int stationId, String csv, LocalDate from) {
        List<DailyTemperature> temperatures = new ArrayList<>();
        boolean inData = false;
        for (String line : csv.split("\\R")) {
            if (!inData) {
                inData = line.startsWith("Från Datum Tid");
                continue;
            }
            String[] columns = line.split(";", -1);
            if (columns.length < 4) {
                continue;
            }
            try {
                LocalDate date = LocalDate.parse(columns[2]);
                if (date.isBefore(from)) {
                    continue;
                }
                temperatures.add(new DailyTemperature(stationId, date, Double.parseDouble(columns[3])));
            } catch (DateTimeParseException | NumberFormatException e) {
                // not a data row
            }
        }
        return temperatures;
    }
}
