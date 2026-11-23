package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserPrincipal;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.DeferredSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.util.function.SingletonSupplier;

import java.time.Duration;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Keeps only the user's id in the session and rebuilds the authentication from the database on each request,
 * for password and GitHub logins alike.
 * <p>
 * Spring's default repository stores the whole serialized SecurityContext. Spring Security changes the
 * serialVersionUID of its classes every minor version, so after an upgrade the stored sessions would fail to
 * load. A plain Long does not have that problem, and a deleted user is logged out at once.
 */
public class UserIdSessionSecurityContextRepository implements SecurityContextRepository {
    // Sessions from before GitHub login stored the username instead ("pelletstracker.username"). Those are
    // deliberately not read: a username can be freed (account deleted) and taken by a new GitHub user, and
    // the old session would then be logged in as that person. They count as logged out
    static final String USER_ID_ATTRIBUTE = "pelletstracker.userId";

    private final AppUserRepository appUserRepository;
    private final Duration sessionTimeout;
    private final SecurityContextHolderStrategy holderStrategy = SecurityContextHolder.getContextHolderStrategy();

    /**
     * @param sessionTimeout the normal idle timeout (SESSION_TIMEOUT), set on every login since the session
     *                       may have been created short-lived for a GitHub login attempt
     */
    public UserIdSessionSecurityContextRepository(AppUserRepository appUserRepository, Duration sessionTimeout) {
        this.appUserRepository = appUserRepository;
        this.sessionTimeout = sessionTimeout;
    }

    @Override
    public DeferredSecurityContext loadDeferredContext(HttpServletRequest request) {
        // Deferred so requests that never check authentication (static assets) skip the database
        Supplier<SecurityContext> context = SingletonSupplier.of(() -> loadContext(request));
        return new DeferredSecurityContext() {
            @Override
            public SecurityContext get() {
                return context.get();
            }

            // True when nothing was stored, i.e. the empty context was made up rather than loaded
            @Override
            public boolean isGenerated() {
                return !containsContext(request);
            }
        };
    }

    private SecurityContext loadContext(HttpServletRequest request) {
        SecurityContext context = holderStrategy.createEmptyContext();
        // Empty if the user was removed since login: the session then counts as logged out
        storedUser(request).map(AppUserPrincipal::of).ifPresent(user -> context.setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities())));
        return context;
    }

    private Optional<AppUser> storedUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session != null && session.getAttribute(USER_ID_ATTRIBUTE) instanceof Long id
                ? appUserRepository.findById(id)
                : Optional.empty();
    }

    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = context.getAuthentication();
        boolean loggedIn = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        if (loggedIn) {
            Long userId = userId(authentication);
            HttpSession session = request.getSession(true);
            session.setAttribute(USER_ID_ATTRIBUTE, userId);
            session.setMaxInactiveInterval((int) sessionTimeout.toSeconds());
            // Fills spring_session.principal_name, so all sessions of a user can be found (and ended) later
            session.setAttribute(FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME, authentication.getName());
        } else {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.removeAttribute(USER_ID_ATTRIBUTE);
                session.removeAttribute(FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME);
            }
        }
    }

    // Both login paths (DatabaseUserDetailsService, GitHubUserService) put an AppUserPrincipal in place
    private static Long userId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof AppUserPrincipal user) {
            return user.getId();
        }
        throw new IllegalStateException("Unexpected principal type: " + authentication.getPrincipal().getClass());
    }

    @Override
    public boolean containsContext(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session != null && session.getAttribute(USER_ID_ATTRIBUTE) != null;
    }

    @Override
    @Deprecated
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        return loadContext(requestResponseHolder.getRequest());
    }
}
