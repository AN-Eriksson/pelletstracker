package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.time.Duration;

/**
 * Keeps the started GitHub login in the session, like Spring's default, but makes a session that only exists
 * for it short-lived. Starting a login is open to anyone and creates a session row in Postgres; with the normal
 * timeout (SESSION_TIMEOUT, 30 days) abandoned attempts, or a bot calling /oauth2/authorization/github in a
 * loop, would pile up for a month. A successful login sets the normal timeout again
 * (UserIdSessionSecurityContextRepository.saveContext).
 */
class ShortLivedAuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    static final Duration LOGIN_ATTEMPT_TIMEOUT = Duration.ofMinutes(10);

    private final AuthorizationRequestRepository<OAuth2AuthorizationRequest> delegate =
            new HttpSessionOAuth2AuthorizationRequestRepository();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return delegate.loadAuthorizationRequest(request);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request,
                                         HttpServletResponse response) {
        delegate.saveAuthorizationRequest(authorizationRequest, request, response);
        HttpSession session = request.getSession(false);
        // Only a session nobody is logged in to; never shorten a logged-in one
        if (session != null && session.getAttribute(UserIdSessionSecurityContextRepository.USER_ID_ATTRIBUTE) == null) {
            session.setMaxInactiveInterval((int) LOGIN_ATTEMPT_TIMEOUT.toSeconds());
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        return delegate.removeAuthorizationRequest(request, response);
    }
}
