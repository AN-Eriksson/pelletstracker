package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PelletRepository extends MongoRepository<Pellet, String> {

}
