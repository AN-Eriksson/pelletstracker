package me.andreaseriksson.pelletstracker.pellet;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PelletRepository {

    private List<Pellet> pellets = new ArrayList<>();

    // Returns a list of all pellet records
    List<Pellet> findAll() {
        return pellets;
    }

    Optional<Pellet> findById(Integer id) {
        return pellets.stream()
                .filter(pellet -> pellet.id().equals(id))
                .findFirst();
    }

    void create(Pellet pellet) {
        pellets.add(pellet);
    }

    void update(Pellet pellet, Integer id) {
        Optional<Pellet> existingPellet = findById(id);
        if(existingPellet.isPresent()) {
            pellets.set(pellets.indexOf(existingPellet.get()), pellet);
        }
    }

    void delete(Integer id) {
        pellets.removeIf(pellet -> pellet.id().equals(id));
    }

    // Add two dummy entries on startup.
    @PostConstruct
    private void init() {
        pellets.add(new Pellet(
                1,
                LocalDateTime.now(),
                5
        ));

        pellets.add(new Pellet(
                2,
                LocalDateTime.now(),
                12
        ));
    }


}
