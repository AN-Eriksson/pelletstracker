package me.andreaseriksson.pelletstracker.weather;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SmhiParserTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parseStations_shouldKeepOnlyActiveStationsSortedByName() throws Exception {
        String json = """
                {"station": [
                  {"id": 97400, "name": "Stockholm-Arlanda Flygplats", "latitude": 59.6269, "longitude": 17.9545, "active": true},
                  {"id": 1, "name": "Gammal station", "latitude": 60.0, "longitude": 15.0, "active": false},
                  {"id": 188790, "name": "Abisko Aut", "latitude": 68.3538, "longitude": 18.8164, "active": true}
                ]}""";

        List<WeatherStation> stations = SmhiParser.parseStations(objectMapper.readTree(json));

        assertEquals(List.of(188790, 97400), stations.stream().map(WeatherStation::id).toList());
        assertEquals(59.6269, stations.get(1).latitude());
    }

    @Test
    void parseLatestMonths_shouldReadDayAndValueAndSkipMissing() throws Exception {
        String json = """
                {"value": [
                  {"from": 1795046401000, "to": 1795132800000, "ref": "2026-11-19", "value": "-1.5", "quality": "Y"},
                  {"from": 1795132801000, "to": 1795219200000, "ref": "2026-11-20", "value": "", "quality": "Y"}
                ]}""";

        List<DailyTemperature> temperatures = SmhiParser.parseLatestMonths(97400, objectMapper.readTree(json));

        assertEquals(1, temperatures.size());
        assertEquals(LocalDate.of(2026, 11, 19), temperatures.get(0).getDate());
        assertEquals(-1.5, temperatures.get(0).getMeanC());
        assertEquals(97400, temperatures.get(0).getStationId());
    }

    @Test
    void parseArchiveCsv_shouldReadRowsAfterHeaderFromGivenDate() {
        String csv = """
                ﻿Stationsnamn;Stationsnummer;Stationsnät;Mäthöjd (meter över marken)
                Stockholm-Arlanda Flygplats;97400;SMHIs stationsnät;2.0

                Från Datum Tid (UTC);Till Datum Tid (UTC);Representativt dygn;Lufttemperatur;Kvalitet;;Tidsutsnitt:
                2008-02-01 00:00:01;2008-02-02 00:00:00;2008-02-01;2.5;Y;;Kvalitetskontrollerade historiska data
                2026-07-30 00:00:01;2026-07-31 00:00:00;2026-07-30;21.3;Y
                2026-07-31 00:00:01;2026-08-01 00:00:00;2026-07-31;18.9;Y
                """;

        List<DailyTemperature> temperatures = SmhiParser.parseArchiveCsv(97400, csv, LocalDate.of(2026, 7, 1));

        assertEquals(2, temperatures.size());
        assertEquals(LocalDate.of(2026, 7, 30), temperatures.get(0).getDate());
        assertEquals(18.9, temperatures.get(1).getMeanC());
    }
}
