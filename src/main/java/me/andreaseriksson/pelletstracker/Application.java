package me.andreaseriksson.pelletstracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // daily refresh of SMHI temperatures (WeatherService)
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
