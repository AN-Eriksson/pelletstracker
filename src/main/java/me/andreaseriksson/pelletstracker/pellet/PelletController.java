package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.Valid;
import me.andreaseriksson.pelletstracker.exception.ResourceNotFoundException;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import me.andreaseriksson.pelletstracker.common.ApiResponse;

/**
 * REST controller for managing pellet entries.
 * Handles CRUD operations and custom endpoints for pellet data.
 */
@RestController
@RequestMapping("/api/pellets")
public class PelletController {

    /**
     * Logger for logging informational and error messages within the PelletController.
     */
    private static final Logger logger = LoggerFactory.getLogger(PelletController.class);

    /**
     * Repository for accessing and managing pellet data.
     */
    private final PelletRepository pelletRepository;
    private final AppUserRepository appUserRepository;

    /**
     * Constructs a new PelletController with the given PelletRepository.
     *
     * @param pelletRepository the repository used for pellet data access
     */
    public PelletController(PelletRepository pelletRepository, AppUserRepository appUserRepository) {
        this.pelletRepository = pelletRepository;
        this.appUserRepository = appUserRepository;
    }

    /**
     * Resolves the authenticated application user from the current security principal.
     *
     * @param authentication the active authentication token
     * @return the matching application user
     * @throws ResourceNotFoundException if the authenticated user no longer exists in the database
     */
    private AppUser getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Retrieves all pellet entries for the authenticated user.
     *
     * @param authentication the current authenticated user
     * @return a list of that user's pellet entries
     */
    @GetMapping("")
    ApiResponse<List<PelletEntry>> findAll(Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        return new ApiResponse<>("success", "All pellet entries", this.pelletRepository.findByUser(currentUser));
    }

    /**
     * Retrieves a pellet entry by its ID for the authenticated user.
     *
     * @param id the ID of the pellet to retrieve
     * @param authentication the current authenticated user
     * @return an ApiResponse containing the pellet with the specified ID
     * @throws ResourceNotFoundException if no pellet with the given ID is found
     */
    @GetMapping("/{id}")
    ApiResponse<PelletEntry> findById(@PathVariable Long id, Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        PelletEntry pellet = pelletRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Pellet not found with id " + id));

        return new ApiResponse<>("success", "Pellet entry found", pellet);
    }

    /**
     * Creates a new pellet entry or updates an existing one based on date for the authenticated user.
     * <p>
     * If a pellet entry with the same date exists for the user, its number of sacks is incremented
     * by the value from the request. Otherwise, a new pellet entry is created.
     *
     * @param pelletEntry the pellet entry to create or update
     * @param authentication the current authenticated user
     * @return an ApiResponse containing the created or updated pellet entry
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("")
    ApiResponse<PelletEntry> createOrUpdate(@Valid @RequestBody PelletEntry pelletEntry, Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        Optional<PelletEntry> existing = pelletRepository.findByDateAndUser(pelletEntry.getDate(), currentUser);

        PelletEntry savedEntry;
        if (existing.isPresent()) {
            PelletEntry toUpdate = existing.get();
            toUpdate.setNumberOfSacks(toUpdate.getNumberOfSacks() + pelletEntry.getNumberOfSacks());
            savedEntry = pelletRepository.save(toUpdate);

            logger.info("LOGGER: Updated and saved pellet entry: {}", savedEntry);
            return new ApiResponse<>("success", "Pellet entry updated", savedEntry);
        } else {
            pelletEntry.setUser(currentUser);

            savedEntry = pelletRepository.save(pelletEntry);

            logger.info("LOGGER: Created and saved pellet entry: {}", savedEntry);
            return new ApiResponse<>("success", "Pellet entry created", savedEntry);
        }
    }

    /**
     * Updates an existing pellet entry with the specified ID for the authenticated user.
     *
     * @param pelletEntry the updated pellet data
     * @param id          the ID of the pellet to update
     * @param authentication the current authenticated user
     * @throws ResourceNotFoundException if no pellet with the given ID is found
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping("/{id}")
    void update(@Valid @RequestBody PelletEntry pelletEntry,
                @PathVariable Long id,
                Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        PelletEntry existing = pelletRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Pellet not found with id " + id));

        existing.setDate(pelletEntry.getDate());
        existing.setNumberOfSacks(pelletEntry.getNumberOfSacks());
        pelletRepository.save(existing);
    }

    /**
     * Deletes a pellet entry by its ID for the authenticated user.
     *
     * @param id the ID of the pellet to delete
     * @param authentication the current authenticated user
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id, Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        PelletEntry existing = pelletRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Pellet not found with id " + id));
        pelletRepository.delete(existing);
    }

    /**
     * Returns the number of pellet entries for the authenticated user.
     *
     * @param authentication the current authenticated user
     * @return an ApiResponse containing the total number of entries in the pellet history
     */
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/count")
    ApiResponse<Integer> getNumberOfEntries(Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        List<PelletEntry> pelletEntries = pelletRepository.findByUser(currentUser);
        PelletHistory history = new PelletHistory(pelletEntries);

        return new ApiResponse<>("success", "Total number of pellet entries", history.numberOfEntries());
    }

    /**
     * Retrieves the total number of sacks for a given ISO week and year for the authenticated user.
     * <p>
     * Calculates the start and end dates for the specified week and sums the number of sacks
     * for all of the user's pellet entries within that week.
     *
     * @param week the ISO week number (1-53)
     * @param year the year for which to calculate the total
     * @param authentication the current authenticated user
     * @return an ApiResponse containing the total number of sacks for the specified week and year
     */
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/weeks/{year}/{week}/total")
    ApiResponse<Integer> getTotalForWeekOfYear(@PathVariable("week") int week,
                                               @PathVariable("year") int year,
                                               Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        LocalDate startOfWeek = LocalDate.ofYearDay(year, 1)
                .with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, week)
                .with(java.time.DayOfWeek.MONDAY);
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        logger.info("LOGGER: Querying pellet entries from {} to {}", startOfWeek, endOfWeek);

        int totalNumberOfSacks = 0;
        for (PelletEntry entry : pelletRepository.findByDateBetweenAndUser(startOfWeek, endOfWeek, currentUser)) {
            totalNumberOfSacks += entry.getNumberOfSacks();
        }

        return new ApiResponse<>("success", "Total sacks for the week", totalNumberOfSacks);
    }
}
