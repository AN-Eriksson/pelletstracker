package me.andreaseriksson.pelletstracker.security;

import me.andreaseriksson.pelletstracker.dto.AuthRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest req) {
        var authToken = new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword());
        // Throws on bad credentials, which GlobalExceptionHandler turns into 401
        Authentication authentication = authenticationManager.authenticate(authToken);

        UserDetails user = (UserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("token", tokenService.generateToken(user)));
    }
}
