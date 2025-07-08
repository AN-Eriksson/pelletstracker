package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document
public class Pellet {
    @Id
    private String id;

    @PastOrPresent
    private LocalDateTime date;

    @Min(1)
    private Integer numberOfSacks;

    public Pellet() {}

    public Pellet(LocalDateTime date, Integer numberOfSacks) {
        this.setDate(date);
        this.setNumberOfSacks(numberOfSacks);
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public Integer getNumberOfSacks() {
        return numberOfSacks;
    }

    public void setNumberOfSacks(Integer numberOfSacks) {
        this.numberOfSacks = numberOfSacks;
    }
}
