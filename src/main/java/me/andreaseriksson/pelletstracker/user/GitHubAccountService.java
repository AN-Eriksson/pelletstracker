package me.andreaseriksson.pelletstracker.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Finds the user for a GitHub account, or creates one on the first login (that is the registration).
 */
@Service
public class GitHubAccountService {
    private static final Logger logger = LoggerFactory.getLogger(GitHubAccountService.class);
    private static final int MAX_USERNAME_LENGTH = 100;

    private final AppUserRepository appUserRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final int dailyLimit;

    public GitHubAccountService(AppUserRepository appUserRepository,
                                UserIdentityRepository userIdentityRepository,
                                @Value("${REGISTRATION_DAILY_LIMIT:10}") int dailyLimit) {
        this.appUserRepository = appUserRepository;
        this.userIdentityRepository = userIdentityRepository;
        this.dailyLimit = dailyLimit;
    }

    /**
     * @param githubId GitHub's numeric user id, which never changes
     * @param login    the current GitHub username, stored as the display name
     * @throws RegistrationLimitException if this is a new account and the cap on new accounts is reached
     */
    @Transactional
    public AppUser login(String githubId, String login) {
        return userIdentityRepository.findByProviderAndSubject(UserIdentity.GITHUB, githubId)
                .map(identity -> {
                    AppUser user = identity.getUser();
                    // Follows renames on GitHub; the username stays as it was created
                    user.setDisplayName(login);
                    return user;
                })
                .orElseGet(() -> register(githubId, login));
    }

    private AppUser register(String githubId, String login) {
        long createdToday = appUserRepository.countByCreatedAtAfter(Instant.now().minus(Duration.ofDays(1)));
        if (createdToday >= dailyLimit) {
            logger.warn("GitHub registration refused for id {}: {} accounts created in the last day", githubId,
                    createdToday);
            throw new RegistrationLimitException(dailyLimit);
        }

        AppUser user = new AppUser();
        user.setUsername(freeUsername(login, githubId));
        user.setDisplayName(login);
        user.setRole("USER");
        appUserRepository.save(user);
        userIdentityRepository.save(new UserIdentity(user, UserIdentity.GITHUB, githubId));
        logger.info("Created user '{}' for GitHub id {}", user.getUsername(), githubId);
        return user;
    }

    /**
     * The GitHub username, or with -2, -3 … if it is taken (by a password user, or by someone who had the
     * name on GitHub before). Compared ignoring case, so "Anna" and "anna" are never two users.
     */
    private String freeUsername(String login, String githubId) {
        String base = login == null || login.isBlank() ? "github-" + githubId : login.strip();
        base = base.substring(0, Math.min(base.length(), MAX_USERNAME_LENGTH - 6));
        String candidate = base;
        for (int n = 2; appUserRepository.existsByUsernameIgnoreCase(candidate); n++) {
            candidate = base + "-" + n;
        }
        return candidate;
    }
}
