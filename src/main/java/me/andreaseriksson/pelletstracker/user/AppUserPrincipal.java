package me.andreaseriksson.pelletstracker.user;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The logged-in user, the same for password and GitHub logins. getName() is the app's username in both cases,
 * so controllers find the user with {@code authentication.getName()} however they logged in; the session
 * stores the id.
 */
public final class AppUserPrincipal implements UserDetails, OAuth2User {
    private final Long id;
    private final String username;
    private final String passwordHash;
    private final String displayName;
    private final List<GrantedAuthority> authorities;

    private AppUserPrincipal(AppUser user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.passwordHash = user.getPasswordHash();
        this.displayName = user.getDisplayName();
        this.authorities = List.of(new SimpleGrantedAuthority(roleAuthority(user.getRole())));
    }

    public static AppUserPrincipal of(AppUser user) {
        return new AppUserPrincipal(user);
    }

    /** "user" or "ROLE_USER" → "ROLE_USER" */
    static String roleAuthority(String role) {
        String normalized = role.toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
    }

    public Long getId() {
        return id;
    }

    /** The current GitHub username, or the username for users without one. */
    public String getDisplayName() {
        return displayName != null ? displayName : username;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getName() {
        return username;
    }

    /** Null for GitHub-only users; DatabaseUserDetailsService never hands those to password login. */
    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // Nothing from GitHub's profile is kept beyond the display name
    @Override
    public Map<String, Object> getAttributes() {
        return Map.of();
    }
}
