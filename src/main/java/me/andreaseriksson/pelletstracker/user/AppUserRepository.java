package me.andreaseriksson.pelletstracker.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);

    /**
     * Returns the distinct weather stations picked by any user, for the daily temperature refresh.
     */
    @Query("select distinct u.weatherStationId from AppUser u where u.weatherStationId is not null")
    List<Integer> findDistinctWeatherStationIds();
}
