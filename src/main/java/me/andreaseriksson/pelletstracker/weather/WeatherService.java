package me.andreaseriksson.pelletstracker.weather;

import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Keeps SMHI temperatures for the stations users have picked in the database, so the app does not
 * depend on SMHI being reachable when someone opens it.
 */
@Service
public class WeatherService {

    private static final Logger logger = LoggerFactory.getLogger(WeatherService.class);
    private static final Duration STATION_CACHE_TTL = Duration.ofHours(24);

    private final SmhiClient smhiClient;
    private final DailyTemperatureRepository temperatureRepository;
    private final AppUserRepository appUserRepository;

    private volatile List<WeatherStation> stations = List.of();
    private volatile Instant stationsFetchedAt = Instant.EPOCH;

    public WeatherService(SmhiClient smhiClient,
                          DailyTemperatureRepository temperatureRepository,
                          AppUserRepository appUserRepository) {
        this.smhiClient = smhiClient;
        this.temperatureRepository = temperatureRepository;
        this.appUserRepository = appUserRepository;
    }

    /**
     * Active SMHI temperature stations, cached for a day.
     */
    public List<WeatherStation> getStations() {
        if (stations.isEmpty() || stationsFetchedAt.plus(STATION_CACHE_TTL).isBefore(Instant.now())) {
            stations = smhiClient.fetchActiveStations();
            stationsFetchedAt = Instant.now();
        }
        return stations;
    }

    public Optional<WeatherStation> findStation(int stationId) {
        return getStations().stream().filter(s -> s.id() == stationId).findFirst();
    }

    /**
     * Imports a station's history from the given date and its latest months. Recent days come from
     * latest-months, which is imported last so it wins where the two overlap.
     */
    @Transactional
    public void importStation(int stationId, LocalDate from) {
        List<DailyTemperature> archive = smhiClient.fetchArchive(stationId, from);
        List<DailyTemperature> latest = smhiClient.fetchLatestMonths(stationId);
        save(archive);
        save(latest);
        logger.info("Imported {} archived and {} recent temperatures for station {}", archive.size(), latest.size(), stationId);
    }

    public List<DailyTemperature> getTemperatures(int stationId, LocalDate from) {
        return temperatureRepository.findByStationIdAndDateGreaterThanEqualOrderByDateAsc(stationId, from);
    }

    /**
     * Fetches yesterday's mean (and SMHI's corrections) every morning for all picked stations.
     */
    @Scheduled(cron = "${weather.refresh-cron:0 15 7 * * *}")
    @Transactional
    public void refreshPickedStations() {
        for (Integer stationId : appUserRepository.findDistinctWeatherStationIds()) {
            try {
                save(smhiClient.fetchLatestMonths(stationId));
            } catch (RestClientException e) {
                logger.warn("Could not refresh temperatures for station {}: {}", stationId, e.getMessage());
            }
        }
    }

    private void save(List<DailyTemperature> temperatures) {
        for (DailyTemperature t : temperatures) {
            temperatureRepository.upsert(t.getStationId(), t.getDate(), t.getMeanC());
        }
    }
}
