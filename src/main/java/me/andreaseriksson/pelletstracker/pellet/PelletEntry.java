package me.andreaseriksson.pelletstracker.pellet;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Represents a pellet entry with a unique date and the number of sacks.
 */
@Entity
@Table(
        name = "pellet_entries",
        uniqueConstraints = @UniqueConstraint(name = "uk_pellet_entries_date", columnNames = "entry_date")
)
public class PelletEntry {
    /**
     * The unique identifier for the pellet entry.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    /**
     * The date of the pellet entry. Must be unique.
     */
    @Column(name = "entry_date", nullable = false, unique = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "date must not be null")
    private LocalDate date;

    /**
     * The number of sacks for the pellet entry. Must be at least 1.
     */
    @Min(1)
    @NotNull(message = "numberOfSacks must not be null")
    @Column(nullable = false)
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
    public Long getId() {
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
        this.date = Objects.requireNonNull(date, "date must not be null");
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

    @Override
    public String toString() {
        return String.format("PelletEntry{id=%s, date=%s, numberOfSacks=%s}", id, date, numberOfSacks);
    }
}
