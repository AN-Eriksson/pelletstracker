package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import java.io.IOException;

/**
 * Back to the SPA with ?login=avbruten (the user said no on GitHub), ?login=fullt (cap on new accounts
 * reached) or ?login=fel (anything else); LoginForm shows a message for each.
 */
class GitHubLoginFailureHandler implements AuthenticationFailureHandler {
    private static final Logger logger = LoggerFactory.getLogger(GitHubLoginFailureHandler.class);

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        String errorCode = exception instanceof OAuth2AuthenticationException oauth
                ? oauth.getError().getErrorCode()
                : "";
        String reason = switch (errorCode) {
            case "access_denied" -> "avbruten";
            case GitHubUserService.REGISTRATION_LIMIT -> "fullt";
            default -> "fel";
        };
        logger.info("GitHub login failed ({}): {}", errorCode, exception.getMessage());
        response.sendRedirect(request.getContextPath() + "/?login=" + reason);
    }
}
