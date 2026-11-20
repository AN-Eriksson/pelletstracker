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
    @NotNull(message = "amountKg must not be null")
    private Integer amountKg;

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getAmountKg() {
        return amountKg;
    }

    public void setAmountKg(Integer amountKg) {
        this.amountKg = amountKg;
    }
}
