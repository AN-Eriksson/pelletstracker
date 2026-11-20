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
     * The amount of pellets in kilograms for the pellet entry.
     */
    @Min(1)
    @NotNull(message = "amountKg must not be null")
    @Column(name = "amount_kg", nullable = false)
    private Integer amountKg;


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
     * Constructs a pellet entry with the specified date and amount in kilograms.
     *
     * @param date the date of the pellet entry
     * @param amountKg the amount in kilograms
     */
    public PelletEntry(LocalDate date, Integer amountKg) {
        this.setDate(date);
        this.setAmountKg(amountKg);
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
     * Returns the amount in kilograms.
     *
     * @return the amount in kilograms
     */
    public Integer getAmountKg() {
        return amountKg;
    }

    /**
     * Sets the amount in kilograms.
     *
     * @param amountKg the amount in kilograms to set
     */
    public void setAmountKg(Integer amountKg) {
        this.amountKg = amountKg;
    }

    @Override
    public String toString() {
        return String.format("PelletEntry{id=%s, date=%s, amountKg=%s}", id, date, amountKg);
    }
}
