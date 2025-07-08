package me.andreaseriksson.pelletstracker.pellet;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class PelletNotFoundException extends RuntimeException{
    public PelletNotFoundException() {
        super("Pellet not found");
    }
}
