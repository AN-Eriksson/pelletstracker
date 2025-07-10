package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pellets")
public class PelletController {

    private final PelletRepository pelletRepository;

    public PelletController(PelletRepository pelletRepository) {
        this.pelletRepository = pelletRepository;

    }

    @GetMapping("")
    List<Pellet> findAll() {
        return this.pelletRepository.findAll();
    }

    @GetMapping("/{id}")
    Pellet findById(@PathVariable String id) {
        Optional<Pellet> pellet =  pelletRepository.findById(id);
        if(pellet.isEmpty()) {
            throw new PelletNotFoundException();
        }

        return pellet.get();
    }

    /**
     * Adds a new Pellet object or updates the existing if there already is one with the same date.
     * @param pellet
     * @return
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("")
    Pellet createOrUpdate(@Valid @RequestBody Pellet pellet) {
        Optional<Pellet> existing = pelletRepository.findByDate(pellet.getDate());
        if (existing.isPresent()) {
            Pellet toUpdate = existing.get();
            toUpdate.setNumberOfSacks(toUpdate.getNumberOfSacks() + pellet.getNumberOfSacks());
            return pelletRepository.save(toUpdate);
        } else {
            return pelletRepository.save(pellet);
        }
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping("/{id}")
    void update(@Valid @RequestBody Pellet pellet, @PathVariable String id) {
        pellet.setId(id);
        pelletRepository.save(pellet);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    void delete(@PathVariable String id) {
        pelletRepository.deleteById(id);
    }

}
