package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.Cookie;
import me.andreaseriksson.pelletstracker.pellet.PelletController;
import me.andreaseriksson.pelletstracker.pellet.PelletRepository;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import me.andreaseriksson.pelletstracker.user.DatabaseUserDetailsService;
import me.andreaseriksson.pelletstracker.user.GitHubAccountService;
import me.andreaseriksson.pelletstracker.user.UserIdentityRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.util.UriComponentsBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The production setup: GitHub configured, password login off (PASSWORD_LOGIN_ENABLED not set). The round
 * trip through GitHub itself cannot run here; GitHubAccountServiceTest covers what happens after it.
 */
@WebMvcTest({AuthController.class, PelletController.class})
@Import({SecurityConfig.class, DatabaseUserDetailsService.class, GitHubLoginConfig.class, GitHubAccountService.class})
@TestPropertySource(properties = {
        "CORS_ALLOWED_ORIGINS=http://localhost:5173",
        "GITHUB_CLIENT_ID=test-client-id",
        "GITHUB_CLIENT_SECRET=test-client-secret",
        // Explicitly off: a local .env (read through spring.config.import) may turn it on
        "PASSWORD_LOGIN_ENABLED=false"
})
class GitHubLoginTest {
    private static final String AUTHORIZE = "/oauth2/authorization/github";
    private static final String CALLBACK = "/login/oauth2/code/github";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private UserIdentityRepository userIdentityRepository;

    @MockitoBean
    private PelletRepository pelletRepository;

    @Test
    void config_shouldOfferOnlyGitHub() throws Exception {
        mockMvc.perform(get("/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordLogin").value(false))
                .andExpect(jsonPath("$.github").value(true));
    }

    @Test
    void passwordLogin_whenTurnedOff_shouldReturn404() throws Exception {
        // The CSRF check only compares the cookie with the header, so any matching pair gets past it
        mockMvc.perform(post("/auth/login")
                        .cookie(new Cookie("XSRF-TOKEN", "token"))
                        .header("X-XSRF-TOKEN", "token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester\",\"password\":\"right\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorize_shouldRedirectToGitHubWithOurCallback() throws Exception {
        MvcResult result = mockMvc.perform(get(AUTHORIZE)).andExpect(status().isFound()).andReturn();

        var location = UriComponentsBuilder.fromUriString(result.getResponse().getRedirectedUrl()).build();
        assertThat(location.getHost()).isEqualTo("github.com");
        assertThat(location.getPath()).isEqualTo("/login/oauth/authorize");
        assertThat(location.getQueryParams().getFirst("client_id")).isEqualTo("test-client-id");
        assertThat(location.getQueryParams().getFirst("scope")).isEqualTo("read:user");
        assertThat(location.getQueryParams().getFirst("redirect_uri")).isEqualTo("http://localhost" + CALLBACK);
    }

    // Starting a login is open to anyone; abandoned attempts must not keep a session row for SESSION_TIMEOUT
    @Test
    void authorize_shouldMakeTheSessionShortLived() throws Exception {
        MvcResult result = mockMvc.perform(get(AUTHORIZE)).andExpect(status().isFound()).andReturn();

        assertThat(result.getRequest().getSession(false).getMaxInactiveInterval()).isEqualTo(10 * 60);
    }

    @Test
    void protectedPath_shouldStillReturn401_notRedirectToGitHub() throws Exception {
        mockMvc.perform(get("/api/pellets/count")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void deniedOnGitHub_shouldReturnToTheAppWithReason() throws Exception {
        MockHttpSession session = new MockHttpSession();
        MvcResult authorize = mockMvc.perform(get(AUTHORIZE).session(session)).andReturn();
        // The state in the URL is percent-encoded; MockMvc's param() wants the plain value
        String state = UriComponentsBuilder.fromUriString(authorize.getResponse().getRedirectedUrl()).build()
                .getQueryParams().getFirst("state");
        state = java.net.URLDecoder.decode(state, java.nio.charset.StandardCharsets.UTF_8);

        mockMvc.perform(get(CALLBACK).session(session)
                        .param("error", "access_denied")
                        .param("state", state))
                .andExpect(redirectedUrl("/?login=avbruten"));
    }

    // E.g. an old or forged link: no login was started in this session
    @Test
    void callbackWithoutStartedLogin_shouldReturnToTheAppWithError() throws Exception {
        mockMvc.perform(get(CALLBACK).param("code", "c").param("state", "s"))
                .andExpect(redirectedUrl("/?login=fel"));
    }
}
