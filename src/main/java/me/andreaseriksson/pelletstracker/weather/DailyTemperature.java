package me.andreaseriksson.pelletstracker.weather;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * Daily mean air temperature at an SMHI station, cached from SMHI Open Data.
 */
@Entity
@Table(name = "daily_temperatures")
@IdClass(DailyTemperature.Key.class)
public class DailyTemperature {

    @Id
    @JsonIgnore
    @Column(name = "station_id", nullable = false)
    private Integer stationId;

    @Id
    @Column(name = "temp_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    @Column(name = "mean_c", nullable = false)
    private Double meanC;

    public DailyTemperature() {}

    public DailyTemperature(Integer stationId, LocalDate date, Double meanC) {
        this.stationId = stationId;
        this.date = date;
        this.meanC = meanC;
    }

    public Integer getStationId() {
        return stationId;
    }

    public LocalDate getDate() {
        return date;
    }

    public Double getMeanC() {
        return meanC;
    }

    /**
     * Composite primary key (station, date).
     */
    public record Key(Integer stationId, LocalDate date) implements Serializable {
        public Key() {
            this(null, null);
        }
    }
}
