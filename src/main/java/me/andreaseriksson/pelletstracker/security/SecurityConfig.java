package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.DispatcherType;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;
import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository,
                                                   ObjectProvider<GitHubUserService> gitHubUserService)
            throws Exception {
        http
                .cors(withDefaults())
                // The SPA reads the XSRF-TOKEN cookie and sends it back as the X-XSRF-TOKEN header on every
                // POST/PUT/DELETE (lib/csrf.ts). Plain handler instead of the default XOR one, because the
                // header carries the raw cookie value
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
                .authorizeHttpRequests(requests -> requests
                        // Error pages (e.g. the 403 for a missing CSRF token) must not turn into 401
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        // Reach login; answers 404 itself when PASSWORD_LOGIN_ENABLED is off
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/auth/config").permitAll()
                        .requestMatchers("/auth/me").authenticated()
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/**").permitAll()     // static SPA assets
                        .anyRequest().authenticated()
                )
                // Login state lives in the session (Spring Session JDBC, cookie pelletstracker_session).
                // AuthController saves it on login through the same repository
                .securityContext(context -> context.securityContextRepository(securityContextRepository))
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")  // POST only, since CSRF protection is on
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                // The SPA never needs "go back to the page you wanted after login", and the request cache
                // would create a session (a database row) for every anonymous 401
                .requestCache(cache -> cache.requestCache(new NullRequestCache()))
                // Not logged in on a protected path: 401 for the SPA instead of a redirect or 403
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

        // Log in with GitHub, when GitHubLoginConfig is active (GITHUB_CLIENT_ID set). The SPA's button links
        // to /oauth2/authorization/github; GitHub sends the user back to /login/oauth2/code/github, where
        // the login is saved in the session through the repository above, with a new session id
        GitHubUserService gitHub = gitHubUserService.getIfAvailable();
        if (gitHub != null) {
            http.oauth2Login(oauth -> oauth
                    .loginPage("/")     // the SPA's login screen, not Spring's generated page
                    // A session that only holds a started login lives 10 minutes, not SESSION_TIMEOUT
                    .authorizationEndpoint(endpoint -> endpoint
                            .authorizationRequestRepository(new ShortLivedAuthorizationRequestRepository()))
                    .userInfoEndpoint(userInfo -> userInfo.userService(gitHub))
                    .authorizedClientRepository(new DiscardingAuthorizedClientRepository())
                    .successHandler(new SimpleUrlAuthenticationSuccessHandler("/"))
                    .failureHandler(new GitHubLoginFailureHandler()));
        }
        return http.build();
    }

    @Bean
    SecurityContextRepository securityContextRepository(
            AppUserRepository appUserRepository,
            // The same setting Spring Session uses for new sessions (SESSION_TIMEOUT)
            @Value("${spring.session.timeout:30d}") Duration sessionTimeout) {
        return new UserIdSessionSecurityContextRepository(appUserRepository, sessionTimeout);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${CORS_ALLOWED_ORIGINS}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
