package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PelletRepository extends MongoRepository<Pellet, String> {

    Optional<Pellet> findByDate(LocalDate date);
}
