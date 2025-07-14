package me.andreaseriksson.pelletstracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Configures the Spring Security filter chain for HTTP requests.
     * <p>
     * - Enables CORS using the default configuration.
     * - Disables CSRF protection (not recommended for production).
     * - Permits all HTTP requests without authentication (for development purposes only).
     * - Sets session creation policy to IF_REQUIRED.
     * - Enables HTTP Basic authentication.
     * <p>
     * <b>Note:</b> The use of {@code permitAll()} is for development only and should be replaced
     * with proper authorization rules before deploying to production.
     *
     * @param http the {@link HttpSecurity} to modify
     * @return the configured {@link SecurityFilterChain}
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .httpBasic(withDefaults());
        return http.build();
    }

    /**
     * Configures CORS (Cross-Origin Resource Sharing) settings for the application.
     * <p>
     * - Allows requests from http://localhost:5173 (Vite frontend dev server).
     * - Permits HTTP methods: GET, POST, PUT, PATCH, OPTIONS, DELETE.
     * - Accepts all headers.
     * - Allows credentials (cookies, authorization headers, etc.).
     * - Applies these settings to all endpoints (/**).
     *
     * @return a CorsConfigurationSource bean with the specified CORS settings
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Provides an in-memory user details service for authentication.
     * <p>
     * - Creates a single user with username "andreas" and password "1234" (no encoding).
     * - Assigns the "USER" role to the user.
     * <p>
     * <b>Note:</b> This configuration is for development/testing only and should not be used in production.
     *
     * @return a {@link UserDetailsService} with a single in-memory user
     */
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user1 = User.withUsername("andreas")
                .password("{noop}1234")
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(user1);
    }
}
