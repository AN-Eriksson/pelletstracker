package me.andreaseriksson.pelletstracker.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

@Entity
@Table(
        name = "app_users",
        uniqueConstraints = @UniqueConstraint(name = "uk_app_users_username", columnNames = "username")
)
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    /**
     * BCrypt hash, or null for users who only log in with GitHub (they have no password here).
     */
    @JsonIgnore
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String role;

    /**
     * SMHI weather station used for the temperature comparison, or null until the user picks one.
     */
    @Column(name = "weather_station_id")
    private Integer weatherStationId;

    /**
     * The name shown in the app: the current GitHub username, updated on every GitHub login. Null for users
     * who have only logged in with a password; the app shows the username then.
     */
    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getWeatherStationId() {
        return weatherStationId;
    }

    public void setWeatherStationId(Integer weatherStationId) {
        this.weatherStationId = weatherStationId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
