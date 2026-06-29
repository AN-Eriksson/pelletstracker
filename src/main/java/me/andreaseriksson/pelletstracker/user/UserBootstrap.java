package me.andreaseriksson.pelletstracker.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserBootstrap implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(UserBootstrap.class);
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapUsername;
    private final String bootstrapPassword;
    private final String bootstrapRole;

    public UserBootstrap(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${APP_BOOTSTRAP_USERNAME:}") String bootstrapUsername,
            @Value("${APP_BOOTSTRAP_PASSWORD:}") String bootstrapPassword,
            @Value("${APP_BOOTSTRAP_ROLE:USER}") String bootstrapRole) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapUsername = bootstrapUsername;
        this.bootstrapPassword = bootstrapPassword;
        this.bootstrapRole = bootstrapRole;
    }

    @Override
    public void run(String... args) {
        if (bootstrapUsername.isBlank() || bootstrapPassword.isBlank()) {
            logger.info("UserBootstrap skipped: APP_BOOTSTRAP_USERNAME or APP_BOOTSTRAP_PASSWORD is empty");
            return;
        }

        boolean exists = appUserRepository.findByUsername(bootstrapUsername).isPresent();
        if (exists) {
            logger.info("UserBootstrap skipped: user '{}' already exists", bootstrapUsername);
            return;
        }

        AppUser appUser = new AppUser();
        appUser.setUsername(bootstrapUsername);
        appUser.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
        appUser.setRole(bootstrapRole);
        appUserRepository.save(appUser);
        logger.info("UserBootstrap created user '{}' with role '{}'", bootstrapUsername, bootstrapRole);
    }
}
