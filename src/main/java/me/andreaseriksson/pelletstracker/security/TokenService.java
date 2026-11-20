package me.andreaseriksson.pelletstracker.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/** Issues the bearer tokens returned by {@code POST /auth/login}. */
@Service
public class TokenService {
    static final String ISSUER = "pelletstracker";
    // Read back into authorities by the converter in SecurityConfig
    static final String ROLES_CLAIM = "roles";

    private final JwtEncoder encoder;
    private final Duration lifetime;

    public TokenService(JwtEncoder encoder, @Value("${JWT_EXP_MS:3600000}") long expirationMs) {
        this.encoder = encoder;
        this.lifetime = Duration.ofMillis(expirationMs);
    }

    public String generateToken(UserDetails user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(lifetime))
                .claim(ROLES_CLAIM, user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                .build();
        // The header must name the algorithm, or the encoder looks for an RSA key
        JwsHeader header = JwsHeader.with(JwtConfig.ALGORITHM).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
