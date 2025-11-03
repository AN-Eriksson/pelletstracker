package me.andreaseriksson.pelletstracker.pellet;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/**
 * Represents a pellet entry with a unique date and the number of sacks.
 */
@Document
public class PelletEntry {
    /**
     * The unique identifier for the pellet entry.
     */
    @Id
    private String id;

    /**
     * The date of the pellet entry. Must be unique.
     */
    @Indexed(unique = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    /**
     * The number of sacks for the pellet entry. Must be at least 1.
     */
    @Min(1)
    private Integer numberOfSacks;

    /**
     * Default constructor.
     */
    public PelletEntry() {}

    /**
     * Constructs a Pellet with the specified date and number of sacks.
     *
     * @param date the date of the pellet entry
     * @param numberOfSacks the number of sacks
     */
    public PelletEntry(LocalDate date, Integer numberOfSacks) {
        this.setDate(date);
        this.setNumberOfSacks(numberOfSacks);
    }

    /**
     * Returns the unique identifier of the pellet entry.
     *
     * @return the id
     */
    public String getId() {
        return id;
    }

    /**
     * Returns the date of the pellet entry.
     *
     * @return the date
     */
    public LocalDate getDate() {
        return date;
    }

    /**
     * Sets the date of the pellet entry.
     *
     * @param date the date to set
     */
    public void setDate(LocalDate date) {
        this.date = date != null ? date : null;
    }

    /**
     * Returns the number of sacks.
     *
     * @return the number of sacks
     */
    public Integer getNumberOfSacks() {
        return numberOfSacks;
    }

    /**
     * Sets the number of sacks.
     *
     * @param numberOfSacks the number of sacks to set
     */
    public void setNumberOfSacks(Integer numberOfSacks) {
        this.numberOfSacks = numberOfSacks;
    }

    /**
     * Sets the unique identifier of the pellet entry.
     *
     * @param id the id to set
     */
    public void setId(String id) {
        this.id = id;
    }
}
