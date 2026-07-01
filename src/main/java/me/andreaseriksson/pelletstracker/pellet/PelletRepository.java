package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import me.andreaseriksson.pelletstracker.user.AppUser;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@link PelletEntry} entities.
 * Queries are scoped by {@link me.andreaseriksson.pelletstracker.user.AppUser} where needed.
 */
@Repository
public interface PelletRepository extends JpaRepository<PelletEntry, Long> {

    /**
     * Finds a pellet entry by date for a specific user.
     *
     * @param date the date of the pellet entry
     * @param user the owning user
     * @return an Optional containing the found pellet entry, or empty if not found
     */
    Optional<PelletEntry> findByDateAndUser(LocalDate date, AppUser user);

    /**
     * Finds a pellet entry by id for a specific user.
     *
     * @param id the pellet entry id
     * @param user the owning user
     * @return an Optional containing the found pellet entry, or empty if not found
     */
    Optional<PelletEntry> findByIdAndUser(Long id, AppUser user);

    /**
     * Finds all pellet entries belonging to a specific user.
     *
     * @param user the owning user
     * @return all pellet entries for that user
     */
    List<PelletEntry> findByUser(AppUser user);

    /**
     * Finds all pellet entries for a specific user within the specified date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @param user the owning user
     * @return a list of pellet entries within the date range for that user
     */
    List<PelletEntry> findByDateBetweenAndUser(LocalDate startDate, LocalDate endDate, AppUser user);
}
