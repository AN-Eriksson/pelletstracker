package me.andreaseriksson.pelletstracker.weather;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/**
 * Reads daily mean air temperature (metobs parameter 2) from SMHI Open Data. No API key is needed.
 */
@Component
public class SmhiClient {

    // metobs parameter 2: air temperature, mean over 1 day
    private static final String DAILY_MEAN_TEMPERATURE = "/parameter/2";

    private final RestClient restClient;

    public SmhiClient(RestClient.Builder builder,
                      @Value("${smhi.metobs.base-url:https://opendata-download-metobs.smhi.se/api/version/1.0}")
                      String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public List<WeatherStation> fetchActiveStations() {
        return SmhiParser.parseStations(restClient.get().uri(DAILY_MEAN_TEMPERATURE + ".json").retrieve().body(JsonNode.class));
    }

    /**
     * Roughly the last four months, including values not yet quality controlled.
     */
    public List<DailyTemperature> fetchLatestMonths(int stationId) {
        JsonNode root = restClient.get()
                .uri(DAILY_MEAN_TEMPERATURE + "/station/{id}/period/latest-months/data.json", stationId)
                .retrieve()
                .body(JsonNode.class);
        return SmhiParser.parseLatestMonths(stationId, root);
    }

    /**
     * Quality-controlled history up to about three months ago, from the given date on.
     */
    public List<DailyTemperature> fetchArchive(int stationId, LocalDate from) {
        byte[] csv = restClient.get()
                .uri(DAILY_MEAN_TEMPERATURE + "/station/{id}/period/corrected-archive/data.csv", stationId)
                .retrieve()
                .body(byte[].class);
        return SmhiParser.parseArchiveCsv(stationId, new String(csv, StandardCharsets.UTF_8), from);
    }
}
