package me.andreaseriksson.pelletstracker.pellet;

import jakarta.validation.constraints.Min;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document
public class Pellet {
    @Id
    private String id;

    @Indexed(unique = true)
    private LocalDate date;

    @Min(1)
    private Integer numberOfSacks;

    public Pellet() {}

    public Pellet(LocalDate date, Integer numberOfSacks) {
        this.setDate(date);
        this.setNumberOfSacks(numberOfSacks);
    }

    public String getId() {
        return id;
    }

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

    public void setId(String id) {
        this.id = id;
    }
}
