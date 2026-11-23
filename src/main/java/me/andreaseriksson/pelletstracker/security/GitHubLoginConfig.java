package me.andreaseriksson.pelletstracker.security;

import me.andreaseriksson.pelletstracker.user.GitHubAccountService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;

/**
 * "Log in with GitHub", only when GITHUB_CLIENT_ID is set (SecurityConfig turns on oauth2Login when these
 * beans exist). The OAuth app's callback URL must be {@code <origin>/login/oauth2/code/github}.
 * Not Spring Boot's spring.security.oauth2.client.* properties: those refuse an empty client id, and an
 * empty one is the normal case locally.
 */
@Configuration
@ConditionalOnExpression("!'${GITHUB_CLIENT_ID:}'.isBlank()")
public class GitHubLoginConfig {

    @Bean
    ClientRegistrationRepository clientRegistrationRepository(@Value("${GITHUB_CLIENT_ID}") String clientId,
                                                              @Value("${GITHUB_CLIENT_SECRET:}") String clientSecret) {
        if (clientSecret.isBlank()) {
            throw new IllegalStateException("GITHUB_CLIENT_SECRET must be set when GITHUB_CLIENT_ID is");
        }
        // Scope read:user: the public profile only, no e-mail and no repositories
        return new InMemoryClientRegistrationRepository(CommonOAuth2Provider.GITHUB.getBuilder("github")
                .clientId(clientId.strip())
                .clientSecret(clientSecret.strip())
                .build());
    }

    @Bean
    GitHubUserService gitHubUserService(GitHubAccountService gitHubAccountService) {
        return new GitHubUserService(new DefaultOAuth2UserService(), gitHubAccountService);
    }
}
