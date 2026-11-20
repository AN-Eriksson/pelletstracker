-- Weather data for comparing pellet consumption with the outdoor temperature.

-- SMHI station the user has picked (SMHI station numbers are integers, e.g. 97400 = Stockholm-Arlanda)
ALTER TABLE app_users ADD COLUMN weather_station_id INTEGER;

-- Daily mean air temperature per SMHI station (metobs parameter 2), cached from SMHI Open Data
CREATE TABLE daily_temperatures (
    station_id INTEGER          NOT NULL,
    temp_date  DATE             NOT NULL,
    mean_c     DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (station_id, temp_date)
);
