package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    /**
     * Constructs a new PelletController with the given PelletRepository.
     *
     * @param pelletRepository the repository used for pellet data access
     */
    public PelletController(PelletRepository pelletRepository) {
        this.pelletRepository = pelletRepository;
    }

    /**
     * Retrieves all pellet entries.
     *
     * @return a list of all pellets
     */
    @GetMapping("")
    List<PelletEntry> findAll() {
        return this.pelletRepository.findAll();
    }

    /**
     * Retrieves a pellet entry by its ID.
     *
     * @param id the ID of the pellet to retrieve
     * @return the pellet with the specified ID
     * @throws PelletNotFoundException if no pellet with the given ID is found
     */
    @GetMapping("/{id}")
    PelletEntry findById(@PathVariable String id) {
        Optional<PelletEntry> pellet = pelletRepository.findById(id);
        if (pellet.isEmpty()) {
            throw new PelletNotFoundException();
        }

        return pellet.get();
    }

    /**
     * Creates a new pellet entry or updates an existing one based on the date.
     * <p>
     * If a pellet entry with the same date exists, its number of sacks is incremented
     * by the value from the request. Otherwise, a new pellet entry is created.
     *
     * @param pelletEntry the pellet entry to create or update
     * @return the created or updated pellet entry
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("")
    PelletEntry createOrUpdate(@Valid @RequestBody PelletEntry pelletEntry) {
        Optional<PelletEntry> existing = pelletRepository.findByDate(pelletEntry.getDate());
        if (existing.isPresent()) {
            PelletEntry toUpdate = existing.get();
            toUpdate.setNumberOfSacks(toUpdate.getNumberOfSacks() + pelletEntry.getNumberOfSacks());
            return pelletRepository.save(toUpdate);
        } else {
            return pelletRepository.save(pelletEntry);
        }
    }

    /**
     * Updates an existing pellet entry with the specified ID.
     *
     * @param pelletEntry the updated pellet data
     * @param id          the ID of the pellet to update
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping("/{id}")
    void update(@Valid @RequestBody PelletEntry pelletEntry, @PathVariable String id) {
        pelletEntry.setId(id);
        pelletRepository.save(pelletEntry);
    }

    /**
     * Deletes a pellet entry by its ID.
     *
     * @param id the ID of the pellet to delete
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    void delete(@PathVariable String id) {
        pelletRepository.deleteById(id);
    }

    /**
     * Returns the number of pellet entries.
     *
     * @return the total number of entries in the pellet history
     */
    @GetMapping("/get-number-of-entries")
    int getNumberOfEntries() {
        List<PelletEntry> pelletEntries = pelletRepository.findAll();
        PelletHistory history = new PelletHistory(pelletEntries);
        return history.numberOfEntries();
    }

    /**
     * Retrieves the total number of sacks for a given ISO week and year.
     * <p>
     * Calculates the start and end dates for the specified week and sums the number of sacks
     * for all pellet entries within that week.
     *
     * @param week the ISO week number (1-53)
     * @param year the year for which to calculate the total
     * @return the total number of sacks for the specified week and year
     */
    @GetMapping("/get-total-for-week/{week}/{year}")
    int getEntriesBetweenDates(@PathVariable int week, @PathVariable int year) {
        LocalDate startOfWeek = LocalDate.ofYearDay(year, 1)
                .with(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR, week)
                .with(java.time.DayOfWeek.MONDAY);
        LocalDateTime startDateTime = startOfWeek.atStartOfDay();
        LocalDateTime endDateTime = startOfWeek.plusDays(6).atTime(LocalTime.MAX);

        logger.info("LOGGER: Querying pellet entries from {} to {}", startDateTime, endDateTime);

        int totalNumberOfSacks = 0;
        for(PelletEntry entry : pelletRepository.findByDateBetween(startDateTime, endDateTime)) {
            totalNumberOfSacks += entry.getNumberOfSacks();
        }

        return totalNumberOfSacks;
    }

}
