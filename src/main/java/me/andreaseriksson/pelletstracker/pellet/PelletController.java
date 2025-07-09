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

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("")
    Pellet create(@Valid @RequestBody Pellet pellet) {
        return pelletRepository.save(pellet);
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
