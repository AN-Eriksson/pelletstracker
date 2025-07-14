package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
    Optional<PelletEntry> findByDate(LocalDate date);
}
