package me.andreaseriksson.pelletstracker.weather;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyTemperatureRepository extends JpaRepository<DailyTemperature, DailyTemperature.Key> {

    /**
     * Finds a station's temperatures from the given date on, oldest first.
     */
    List<DailyTemperature> findByStationIdAndDateGreaterThanEqualOrderByDateAsc(Integer stationId, LocalDate from);

    /**
     * Inserts a temperature or replaces it, since SMHI corrects recent values after quality control.
     */
    @Modifying
    @Query(value = """
            INSERT INTO daily_temperatures (station_id, temp_date, mean_c)
            VALUES (:stationId, :date, :meanC)
            ON CONFLICT (station_id, temp_date) DO UPDATE SET mean_c = EXCLUDED.mean_c
            """, nativeQuery = true)
    void upsert(@Param("stationId") int stationId, @Param("date") LocalDate date, @Param("meanC") double meanC);
}
