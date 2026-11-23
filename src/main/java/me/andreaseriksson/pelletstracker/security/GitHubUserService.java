package me.andreaseriksson.pelletstracker.security;

import me.andreaseriksson.pelletstracker.user.AppUserPrincipal;
import me.andreaseriksson.pelletstracker.user.GitHubAccountService;
import me.andreaseriksson.pelletstracker.user.RegistrationLimitException;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * After GitHub has approved the login: reads the GitHub profile (api.github.com/user) and turns it into the
 * app's own user, creating one on the first login.
 */
public class GitHubUserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    static final String REGISTRATION_LIMIT = "registration_limit";

    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> profiles;
    private final GitHubAccountService gitHubAccountService;

    public GitHubUserService(OAuth2UserService<OAuth2UserRequest, OAuth2User> profiles,
                             GitHubAccountService gitHubAccountService) {
        this.profiles = profiles;
        this.gitHubAccountService = gitHubAccountService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User profile = profiles.loadUser(request);
        Object id = profile.getAttribute("id");
        String login = profile.getAttribute("login");
        if (id == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_user_info"), "GitHub profile without id");
        }

        try {
            return AppUserPrincipal.of(gitHubAccountService.login(String.valueOf(id), login));
        } catch (RegistrationLimitException e) {
            throw new OAuth2AuthenticationException(new OAuth2Error(REGISTRATION_LIMIT), e.getMessage(), e);
        }
    }
}
