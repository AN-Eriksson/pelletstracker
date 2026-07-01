package me.andreaseriksson.pelletstracker.pellet;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import me.andreaseriksson.pelletstracker.user.AppUser;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Represents a pellet entry owned by an {@link AppUser}.
 */
@Entity
@Table(
        name = "pellet_entries",
        uniqueConstraints = @UniqueConstraint(name = "uk_pellet_entries_user_date", columnNames = {"user_id", "entry_date"})
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
     * The date of the pellet entry.
     * Uniqueness is enforced per user together with the owner relationship.
     */
    @Column(name = "entry_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "date must not be null")
    private LocalDate date;

    /**
     * The number of sacks for the pellet entry.
     */
    @Min(1)
    @NotNull(message = "numberOfSacks must not be null")
    @Column(nullable = false)
    private Integer numberOfSacks;


    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    /**
     * Default constructor.
     */
    public PelletEntry() {}

    /**
     * Constructs a pellet entry with the specified date and number of sacks.
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
