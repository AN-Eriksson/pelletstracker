package me.andreaseriksson.pelletstracker.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreatePelletEntryDto {
    @NotNull(message = "date must not be null")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @Min(1)
    @NotNull(message = "numberOfSacks must not be null")
    private Integer numberOfSacks;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getNumberOfSacks() {
        return numberOfSacks;
    }

    public void setNumberOfSacks(Integer numberOfSacks) {
        this.numberOfSacks = numberOfSacks;
    }
}
