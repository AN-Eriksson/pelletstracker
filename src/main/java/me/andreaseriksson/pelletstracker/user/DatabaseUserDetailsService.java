package me.andreaseriksson.pelletstracker.user;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Password login (POST /auth/login). */
@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final AppUserRepository appUserRepository;

    public DatabaseUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser appUser = appUserRepository.findByUsername(username)
                // Users created by a GitHub login have no password, so they cannot log in this way
                .filter(user -> user.getPasswordHash() != null)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return AppUserPrincipal.of(appUser);
    }
}
