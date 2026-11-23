package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import me.andreaseriksson.pelletstracker.dto.AuthRequest;
import me.andreaseriksson.pelletstracker.exception.ResourceNotFoundException;
import me.andreaseriksson.pelletstracker.user.AppUserPrincipal;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

/**
 * Password login, the session check and which login methods exist. GitHub login is Spring's oauth2Login
 * (SecurityConfig), logout Spring's LogoutFilter (POST /auth/logout).
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SecurityContextHolderStrategy holderStrategy = SecurityContextHolder.getContextHolderStrategy();
    private final boolean passwordLoginEnabled;
    private final boolean gitHubLoginEnabled;

    public record CurrentUser(String username, String displayName) {
        static CurrentUser of(Authentication authentication) {
            AppUserPrincipal user = (AppUserPrincipal) authentication.getPrincipal();
            return new CurrentUser(user.getUsername(), user.getDisplayName());
        }
    }

    public record LoginOptions(boolean passwordLogin, boolean github) {
    }

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository,
                          // Off by default, so production only has GitHub login; on in the local .env
                          @Value("${PASSWORD_LOGIN_ENABLED:false}") boolean passwordLoginEnabled,
                          ObjectProvider<GitHubUserService> gitHubUserService) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.passwordLoginEnabled = passwordLoginEnabled;
        this.gitHubLoginEnabled = gitHubUserService.getIfAvailable() != null;
    }

    // Public: the login screen asks which buttons and fields to show
    @GetMapping("/config")
    public LoginOptions config() {
        return new LoginOptions(passwordLoginEnabled, gitHubLoginEnabled);
    }

    @PostMapping("/login")
    public ResponseEntity<CurrentUser> login(@RequestBody AuthRequest req,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        if (!passwordLoginEnabled) {
            throw new ResourceNotFoundException("Password login is turned off");
        }
        var credentials = new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword());
        // Throws on bad credentials, which GlobalExceptionHandler turns into 401
        Authentication authentication = authenticationManager.authenticate(credentials);

        // New session id on login, so a session id planted before login (session fixation) is worthless
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        SecurityContext context = holderStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        holderStrategy.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(CurrentUser.of(authentication));
    }

    // The session cookie is HttpOnly, so the SPA asks here whether it is logged in (401 if not)
    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        return CurrentUser.of(authentication);
    }
}
