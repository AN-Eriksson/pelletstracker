package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;

public record Pellet(
        Integer id,
        @PastOrPresent
        LocalDateTime date,
        @Min(1)
        Integer numberOfSacks
) {
}
