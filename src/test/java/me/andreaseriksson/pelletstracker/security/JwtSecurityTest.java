package me.andreaseriksson.pelletstracker.security;

import me.andreaseriksson.pelletstracker.pellet.PelletController;
import me.andreaseriksson.pelletstracker.pellet.PelletRepository;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import me.andreaseriksson.pelletstracker.user.DatabaseUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The real security filter chain in front of a protected endpoint, with a real encoder and decoder.
 * DatabaseUserDetailsService is imported as in the app: without any UserDetailsService the exposed
 * AuthenticationManager bean delegates to itself and a rejected token ends in a StackOverflowError.
 */
@WebMvcTest(PelletController.class)
@Import({SecurityConfig.class, JwtConfig.class, TokenService.class, DatabaseUserDetailsService.class})
@TestPropertySource(properties = {
        "JWT_SECRET=test-secret-that-is-at-least-32-bytes-long",
        "CORS_ALLOWED_ORIGINS=http://localhost:5173",
})
class JwtSecurityTest {
    private static final String PROTECTED = "/api/pellets/count";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private JwtEncoder encoder;

    @MockitoBean
    private PelletRepository pelletRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    private String validToken() {
        return tokenService.generateToken(User.withUsername("tester").password("x").roles("USER").build());
    }

    private String token(JwtEncoder signer, String issuer, Instant expiresAt) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject("tester")
                .issuedAt(expiresAt.minusSeconds(3600))
                .expiresAt(expiresAt)
                .build();
        return signer.encode(JwtEncoderParameters.from(JwsHeader.with(JwtConfig.ALGORITHM).build(), claims))
                .getTokenValue();
    }

    @Test
    void withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get(PROTECTED))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"));
    }

    @Test
    void withValidToken_shouldReachController() throws Exception {
        when(appUserRepository.findByUsername("tester")).thenReturn(Optional.of(new AppUser()));
        when(pelletRepository.findByUser(any())).thenReturn(List.of());

        mockMvc.perform(get(PROTECTED).header("Authorization", "Bearer " + validToken()))
                .andExpect(status().isOk());
    }

    @Test
    void withExpiredToken_shouldReturn401() throws Exception {
        // Beyond the decoder's 60 s clock skew
        String expired = token(encoder, TokenService.ISSUER, Instant.now().minusSeconds(120));

        mockMvc.perform(get(PROTECTED).header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void withTokenSignedByOtherKey_shouldReturn401() throws Exception {
        JwtEncoder otherSigner = new JwtConfig("another-secret-that-is-also-32-bytes-long").jwtEncoder();
        String forged = token(otherSigner, TokenService.ISSUER, Instant.now().plusSeconds(3600));

        mockMvc.perform(get(PROTECTED).header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void withOtherIssuer_shouldReturn401() throws Exception {
        String foreign = token(encoder, "someone-else", Instant.now().plusSeconds(3600));

        mockMvc.perform(get(PROTECTED).header("Authorization", "Bearer " + foreign))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void withGarbageToken_shouldReturn401() throws Exception {
        mockMvc.perform(get(PROTECTED).header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shortSecret_shouldFailAtStartup() {
        assertThatThrownBy(() -> new JwtConfig("too-short"))
                .isInstanceOf(IllegalStateException.class);
    }
}
