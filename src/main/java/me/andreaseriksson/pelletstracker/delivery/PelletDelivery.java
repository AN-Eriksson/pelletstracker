package me.andreaseriksson.pelletstracker.delivery;

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
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import me.andreaseriksson.pelletstracker.user.AppUser;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Pellets added to the stock of an {@link AppUser}, e.g. a delivered pallet.
 */
@Entity
@Table(name = "pellet_deliveries")
public class PelletDelivery {
    /**
     * The unique identifier for the delivery.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    /**
     * The date the pellets were added to the stock.
     */
    @Column(name = "delivery_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "date must not be null")
    private LocalDate date;

    /**
     * The amount of pellets in kilograms.
     */
    @Min(1)
    @NotNull(message = "amountKg must not be null")
    @Column(name = "amount_kg", nullable = false)
    private Integer amountKg;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    /**
     * Default constructor.
     */
    public PelletDelivery() {}

    /**
     * Constructs a delivery with the specified date and amount in kilograms.
     *
     * @param date the date of the delivery
     * @param amountKg the amount in kilograms
     */
    public PelletDelivery(LocalDate date, Integer amountKg) {
        this.setDate(date);
        this.setAmountKg(amountKg);
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = Objects.requireNonNull(date, "date must not be null");
    }

    public Integer getAmountKg() {
        return amountKg;
    }

    public void setAmountKg(Integer amountKg) {
        this.amountKg = amountKg;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    @Override
    public String toString() {
        return String.format("PelletDelivery{id=%s, date=%s, amountKg=%s}", id, date, amountKg);
    }
}
