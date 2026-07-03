package me.andreaseriksson.pelletstracker.security;

import me.andreaseriksson.pelletstracker.dto.AuthRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserDetailsService userDetailsService, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest req) {
        var authToken = new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword());
        authenticationManager.authenticate(authToken);

        UserDetails user = userDetailsService.loadUserByUsername(req.getUsername());
        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(Map.of("token", token));
    }
}
