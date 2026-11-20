package me.andreaseriksson.pelletstracker.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Signing and verification of the app's own HS256 tokens. The decoder is picked up by
 * {@code oauth2ResourceServer().jwt()} in {@link SecurityConfig}; the encoder is used by {@link TokenService}.
 */
@Configuration
public class JwtConfig {
    static final MacAlgorithm ALGORITHM = MacAlgorithm.HS256;

    private final SecretKey key;

    // No default on purpose: without JWT_SECRET the app must not start, or tokens could be forged with a known key
    public JwtConfig(@Value("${JWT_SECRET}") String secret) {
        this.key = signingKey(secret);
    }

    // HS256 needs a key of at least 256 bits. Fail at startup instead of on the first login
    static SecretKey signingKey(String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes (256 bits) for HS256");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    // Default validators check exp and nbf (60 s clock skew); the issuer check rejects tokens not made by this app
    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(ALGORITHM).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(TokenService.ISSUER));
        return decoder;
    }
}
