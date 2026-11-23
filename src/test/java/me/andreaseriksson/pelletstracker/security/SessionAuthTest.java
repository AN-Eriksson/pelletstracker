package me.andreaseriksson.pelletstracker.security;

import jakarta.servlet.http.Cookie;
import me.andreaseriksson.pelletstracker.pellet.PelletController;
import me.andreaseriksson.pelletstracker.pellet.PelletRepository;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import me.andreaseriksson.pelletstracker.user.DatabaseUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The real security filter chain (sessions, CSRF, logout) in front of a protected endpoint. Spring Session is
 * not part of this slice, so MockMvc's plain HttpSession stands in for the JDBC one.
 */
@WebMvcTest({AuthController.class, PelletController.class})
@Import({SecurityConfig.class, DatabaseUserDetailsService.class})
@TestPropertySource(properties = {
        "CORS_ALLOWED_ORIGINS=http://localhost:5173",
        "PASSWORD_LOGIN_ENABLED=true",
        "spring.session.timeout=3d"
})
class SessionAuthTest {
    private static final String PROTECTED = "/api/pellets/count";
    private static final String LOGIN_BODY = "{\"username\":\"tester\",\"password\":\"right\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private PelletRepository pelletRepository;

    @BeforeEach
    void setUp() {
        AppUser user = new AppUser();
        user.setUsername("tester");
        user.setPasswordHash(passwordEncoder.encode("right"));
        user.setRole("USER");
        ReflectionTestUtils.setField(user, "id", 1L);
        when(appUserRepository.findByUsername("tester")).thenReturn(Optional.of(user));
        when(appUserRepository.findById(1L)).thenReturn(Optional.of(user));
        when(pelletRepository.findByUser(any())).thenReturn(List.of());
    }

    // What the SPA does (lib/csrf.ts): take XSRF-TOKEN from any response and send it back as X-XSRF-TOKEN.
    // Not spring-security-test's csrf(): it swaps the token repository in the shared context, after which
    // no real XSRF-TOKEN cookie is written
    private Cookie xsrfCookie() throws Exception {
        // Written as a raw Set-Cookie header, which MockMvc's cookie() matchers do not parse
        String setCookie = mockMvc.perform(get("/auth/me"))
                .andReturn().getResponse().getHeaders("Set-Cookie").stream()
                .filter(header -> header.startsWith("XSRF-TOKEN="))
                .findFirst().orElseThrow();
        return new Cookie("XSRF-TOKEN", setCookie.substring("XSRF-TOKEN=".length()).split(";")[0]);
    }

    private MockHttpServletRequestBuilder withCsrf(MockHttpServletRequestBuilder request) throws Exception {
        Cookie xsrf = xsrfCookie();
        return request.cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue());
    }

    private MockHttpSession login() throws Exception {
        MvcResult result = mockMvc.perform(withCsrf(post("/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("tester"))
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    void notLoggedIn_shouldReturn401() throws Exception {
        mockMvc.perform(get(PROTECTED)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    // Otherwise every anonymous 401 would leave a row in spring_session
    @Test
    void notLoggedIn_shouldNotCreateSession() throws Exception {
        MvcResult result = mockMvc.perform(get(PROTECTED)).andExpect(status().isUnauthorized()).andReturn();

        assertThat(result.getRequest().getSession(false)).isNull();
    }

    @Test
    void login_shouldGiveSessionThatReachesProtectedEndpoints() throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(get(PROTECTED).session(session)).andExpect(status().isOk());
        mockMvc.perform(get("/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("tester"))
                // No GitHub name for a password user, so the username is shown
                .andExpect(jsonPath("$.displayName").value("tester"));
    }

    // E.g. a session created short-lived for a GitHub login attempt
    @Test
    void login_shouldGiveTheSessionTheNormalTimeout() throws Exception {
        MockHttpSession shortLived = new MockHttpSession();
        shortLived.setMaxInactiveInterval(10 * 60);

        MvcResult result = mockMvc.perform(withCsrf(post("/auth/login")).session(shortLived)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getRequest().getSession(false).getMaxInactiveInterval()).isEqualTo(3 * 24 * 60 * 60);
    }

    @Test
    void session_shouldStoreTheUserId() throws Exception {
        MockHttpSession session = login();

        assertThat(session.getAttribute(UserIdSessionSecurityContextRepository.USER_ID_ATTRIBUTE)).isEqualTo(1L);
    }

    // Sessions saved before GitHub login held the username. A username can pass to a new user, so such a
    // session must not log anyone in
    @Test
    void sessionWithOnlyAUsername_shouldNotBeLoggedIn() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("pelletstracker.username", "tester");

        mockMvc.perform(get(PROTECTED).session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void config_shouldTellWhichLoginMethodsExist() throws Exception {
        mockMvc.perform(get("/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordLogin").value(true))
                .andExpect(jsonPath("$.github").value(false));
    }

    // Users created by a GitHub login have no password hash
    @Test
    void login_forUserWithoutPassword_shouldReturn401() throws Exception {
        AppUser gitHubUser = new AppUser();
        gitHubUser.setUsername("octo");
        gitHubUser.setRole("USER");
        when(appUserRepository.findByUsername("octo")).thenReturn(Optional.of(gitHubUser));

        mockMvc.perform(withCsrf(post("/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"octo\",\"password\":\"\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withBadPassword_shouldReturn401() throws Exception {
        mockMvc.perform(withCsrf(post("/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void login_shouldChangeAnExistingSessionId() throws Exception {
        MockHttpSession planted = new MockHttpSession();
        String plantedId = planted.getId();

        MvcResult result = mockMvc.perform(withCsrf(post("/auth/login")).session(planted)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getRequest().getSession(false).getId()).isNotEqualTo(plantedId);
    }

    @Test
    void login_withoutCsrfToken_shouldReturn403() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void csrfToken_fromAnotherCookie_shouldBeRejected() throws Exception {
        Cookie xsrf = xsrfCookie();

        mockMvc.perform(post("/auth/login")
                        .cookie(xsrf)
                        .header("X-XSRF-TOKEN", "not-the-cookie-value")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void writeWithoutCsrfToken_shouldReturn403EvenWhenLoggedIn() throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(post("/api/pellets").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2026-11-20\",\"amountKg\":16}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logout_shouldEndTheSession() throws Exception {
        MockHttpSession session = login();

        mockMvc.perform(withCsrf(post("/auth/logout")).session(session))
                .andExpect(status().isNoContent());

        assertThat(session.isInvalid()).isTrue();
        mockMvc.perform(get(PROTECTED).session(new MockHttpSession())).andExpect(status().isUnauthorized());
    }

    @Test
    void deletedUser_shouldBeLoggedOut() throws Exception {
        MockHttpSession session = login();
        when(appUserRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get(PROTECTED).session(session)).andExpect(status().isUnauthorized());
    }
}
