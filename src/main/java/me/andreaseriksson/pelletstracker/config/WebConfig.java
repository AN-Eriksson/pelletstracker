package me.andreaseriksson.pelletstracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * Spring Web configuration.
 * <p>
 * Configures CORS to allow requests from the Vite development server
 * at http://localhost:5173 during development.
 */
@Configuration
public class WebConfig {

    /**
     * Configures CORS mappings to allow requests from the Vite development server
     * at http://localhost:5173 during development.
     *
     * @return a {@link WebMvcConfigurer} that sets up CORS for development
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173") // Vite default dev server
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}