package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.context.DeferredSecurityContext;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.util.function.SingletonSupplier;

import java.util.function.Supplier;

/**
 * Keeps only the username in the session and rebuilds the authentication from the database on each request.
 * <p>
 * Spring's default repository stores the whole serialized SecurityContext. Spring Security changes the
 * serialVersionUID of its classes every minor version, so after an upgrade the stored sessions would fail to
 * load. A plain String does not have that problem, and a deleted user is logged out at once.
 */
public class UsernameSessionSecurityContextRepository implements SecurityContextRepository {
    static final String USERNAME_ATTRIBUTE = "pelletstracker.username";

    private final UserDetailsService userDetailsService;
    private final SecurityContextHolderStrategy holderStrategy = SecurityContextHolder.getContextHolderStrategy();

    public UsernameSessionSecurityContextRepository(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
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
        String username = storedUsername(request);
        if (username == null) {
            return context;
        }

        try {
            UserDetails user = userDetailsService.loadUserByUsername(username);
            if (user.isEnabled() && user.isAccountNonLocked() && user.isAccountNonExpired()) {
                context.setAuthentication(
                        UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities()));
            }
        } catch (UsernameNotFoundException e) {
            // User removed since login: treat the session as logged out
        }
        return context;
    }

    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = context.getAuthentication();
        boolean loggedIn = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        if (loggedIn) {
            HttpSession session = request.getSession(true);
            session.setAttribute(USERNAME_ATTRIBUTE, authentication.getName());
            // Fills spring_session.principal_name, so all sessions of a user can be found (and ended) later
            session.setAttribute(FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME, authentication.getName());
        } else {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.removeAttribute(USERNAME_ATTRIBUTE);
                session.removeAttribute(FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME);
            }
        }
    }

    @Override
    public boolean containsContext(HttpServletRequest request) {
        return storedUsername(request) != null;
    }

    private static String storedUsername(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session == null ? null : (String) session.getAttribute(USERNAME_ATTRIBUTE);
    }

    @Override
    @Deprecated
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        return loadContext(requestResponseHolder.getRequest());
    }
}
