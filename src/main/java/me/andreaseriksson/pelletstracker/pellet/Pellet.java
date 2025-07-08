package me.andreaseriksson.pelletstracker.pellet;

import java.time.LocalDateTime;

public record Pellet(
        Integer id,
        LocalDateTime date,
        Integer numberOfSacks
) {
}
