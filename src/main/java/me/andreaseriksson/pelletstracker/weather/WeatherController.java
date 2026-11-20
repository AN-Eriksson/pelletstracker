package me.andreaseriksson.pelletstracker.weather;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import me.andreaseriksson.pelletstracker.dto.ApiResponse;
import me.andreaseriksson.pelletstracker.exception.ResourceNotFoundException;
import me.andreaseriksson.pelletstracker.pellet.PelletEntry;
import me.andreaseriksson.pelletstracker.pellet.PelletRepository;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Weather station choice and SMHI temperatures for comparing consumption with the outdoor temperature.
 */
@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    // Without consumption entries, fetch this much history so the comparison has something to start from
    private static final int DEFAULT_HISTORY_DAYS = 120;

    private final WeatherService weatherService;
    private final AppUserRepository appUserRepository;
    private final PelletRepository pelletRepository;

    public WeatherController(WeatherService weatherService,
                             AppUserRepository appUserRepository,
                             PelletRepository pelletRepository) {
        this.weatherService = weatherService;
        this.appUserRepository = appUserRepository;
        this.pelletRepository = pelletRepository;
    }

    public record WeatherSettings(Integer stationId, String stationName) {}

    public record SelectStationRequest(@NotNull Integer stationId) {}

    private AppUser getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Temperatures are needed from the user's first consumption entry, or a default period without entries.
     */
    private LocalDate historyStart(AppUser user) {
        LocalDate fallback = LocalDate.now().minusDays(DEFAULT_HISTORY_DAYS);
        return pelletRepository.findFirstByUserOrderByDateAsc(user)
                .map(PelletEntry::getDate)
                .filter(first -> first.isBefore(fallback))
                .orElse(fallback);
    }

    private WeatherSettings settingsFor(AppUser user) {
        Integer stationId = user.getWeatherStationId();
        if (stationId == null) {
            return new WeatherSettings(null, null);
        }
        String name = weatherService.findStation(stationId).map(WeatherStation::name).orElse(null);
        return new WeatherSettings(stationId, name);
    }

    /**
     * Lists active SMHI stations that report daily mean temperature.
     */
    @GetMapping("/stations")
    ApiResponse<List<WeatherStation>> stations() {
        return new ApiResponse<>("success", "Weather stations", weatherService.getStations());
    }

    /**
     * Returns the authenticated user's weather station, with nulls if none is picked.
     */
    @GetMapping("/settings")
    ApiResponse<WeatherSettings> settings(Authentication authentication) {
        return new ApiResponse<>("success", "Weather settings", settingsFor(getCurrentUser(authentication)));
    }

    /**
     * Sets the authenticated user's weather station and imports its temperatures.
     *
     * @throws ResourceNotFoundException if SMHI has no active temperature station with the given ID
     */
    @PutMapping("/station")
    ApiResponse<WeatherSettings> selectStation(@Valid @RequestBody SelectStationRequest request,
                                               Authentication authentication) {
        AppUser user = getCurrentUser(authentication);
        int stationId = request.stationId();
        weatherService.findStation(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Weather station not found: " + stationId));

        weatherService.importStation(stationId, historyStart(user));
        user.setWeatherStationId(stationId);
        appUserRepository.save(user);

        return new ApiResponse<>("success", "Weather station selected", settingsFor(user));
    }

    /**
     * Daily mean temperatures at the user's station since the first consumption entry, oldest first.
     * Empty until a station is picked.
     */
    @GetMapping("/temperatures")
    ApiResponse<List<DailyTemperature>> temperatures(Authentication authentication) {
        AppUser user = getCurrentUser(authentication);
        List<DailyTemperature> temperatures = user.getWeatherStationId() == null
                ? List.of()
                : weatherService.getTemperatures(user.getWeatherStationId(), historyStart(user));
        return new ApiResponse<>("success", "Daily mean temperatures", temperatures);
    }
}
