package me.andreaseriksson.pelletstracker.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GitHubAccountServiceTest {
    private static final int DAILY_LIMIT = 3;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private UserIdentityRepository userIdentityRepository;

    private GitHubAccountService service;

    @BeforeEach
    void setUp() {
        service = new GitHubAccountService(appUserRepository, userIdentityRepository, DAILY_LIMIT);
        lenient().when(userIdentityRepository.findByProviderAndSubject(anyString(), anyString()))
                .thenReturn(Optional.empty());
        lenient().when(appUserRepository.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void firstLogin_shouldCreateUserLinkedToTheGitHubId() {
        AppUser user = service.login("583231", "octocat");

        assertThat(user.getUsername()).isEqualTo("octocat");
        assertThat(user.getDisplayName()).isEqualTo("octocat");
        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.getPasswordHash()).isNull();

        ArgumentCaptor<UserIdentity> identity = ArgumentCaptor.forClass(UserIdentity.class);
        verify(userIdentityRepository).save(identity.capture());
        assertThat(identity.getValue().getProvider()).isEqualTo("github");
        assertThat(identity.getValue().getSubject()).isEqualTo("583231");
        assertThat(identity.getValue().getUser()).isSameAs(user);
    }

    @Test
    void laterLogin_shouldReturnTheSameUserWithTheCurrentGitHubName() {
        AppUser existing = new AppUser();
        existing.setUsername("octocat");
        existing.setDisplayName("octocat");
        when(userIdentityRepository.findByProviderAndSubject("github", "583231"))
                .thenReturn(Optional.of(new UserIdentity(existing, "github", "583231")));

        AppUser user = service.login("583231", "octocat-renamed");

        assertThat(user).isSameAs(existing);
        assertThat(user.getUsername()).isEqualTo("octocat");
        assertThat(user.getDisplayName()).isEqualTo("octocat-renamed");
        verify(appUserRepository, never()).save(any());
    }

    @Test
    void takenUsername_shouldGetASuffix_butDisplayNameStaysTheGitHubName() {
        when(appUserRepository.existsByUsernameIgnoreCase("octocat")).thenReturn(true);
        when(appUserRepository.existsByUsernameIgnoreCase("octocat-2")).thenReturn(true);

        AppUser user = service.login("583231", "octocat");

        assertThat(user.getUsername()).isEqualTo("octocat-3");
        assertThat(user.getDisplayName()).isEqualTo("octocat");
    }

    @Test
    void newAccount_whenDailyLimitIsReached_shouldBeRefused() {
        when(appUserRepository.countByCreatedAtAfter(any())).thenReturn((long) DAILY_LIMIT);

        assertThatThrownBy(() -> service.login("583231", "octocat"))
                .isInstanceOf(RegistrationLimitException.class);
        verify(appUserRepository, never()).save(any());
    }

    @Test
    void existingAccount_shouldLogIn_evenWhenDailyLimitIsReached() {
        AppUser existing = new AppUser();
        existing.setUsername("octocat");
        when(userIdentityRepository.findByProviderAndSubject("github", "583231"))
                .thenReturn(Optional.of(new UserIdentity(existing, "github", "583231")));

        assertThat(service.login("583231", "octocat")).isSameAs(existing);
        verify(appUserRepository, never()).countByCreatedAtAfter(any());
    }
}
