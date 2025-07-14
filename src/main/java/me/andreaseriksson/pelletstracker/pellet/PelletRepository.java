package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.cglib.core.Local;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing Pellet entities in MongoDB.
 * Extends MongoRepository to provide CRUD operations.
 */
@Repository
public interface PelletRepository extends MongoRepository<PelletEntry, String> {

    /**
     * Finds a Pellet by its date.
     *
     * @param date the date of the pellet entry
     * @return an Optional containing the found Pellet, or empty if not found
     */
    Optional<PelletEntry> findByDate(LocalDateTime date);

    /**
     * Finds all Pellet entries with a date between the specified start and end dates (inclusive).
     *
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @return a list of PelletEntry objects within the date range
     */
    List<PelletEntry> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
