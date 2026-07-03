package me.andreaseriksson.pelletstracker.pellet;

import me.andreaseriksson.pelletstracker.dto.CreatePelletEntryDto;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PelletControllerTest {

    @Mock
    private PelletRepository pelletRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PelletController controller;

    private AppUser testUser;
    private CreatePelletEntryDto testDto;

    @BeforeEach
    void setUp() {
        testUser = new AppUser();
        testUser.setUsername("testuser");

        testDto = new CreatePelletEntryDto();
        testDto.setDate(LocalDate.now());
        testDto.setNumberOfSacks(5);
    }

    @Test
    void createOrUpdate_shouldCreateNewEntry() {
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByDateAndUser(testDto.getDate(), testUser)).thenReturn(Optional.empty());

        var result = controller.createOrUpdate(testDto, authentication);

        assertEquals("success", result.getStatus());
        assertEquals("Pellet entry created", result.getMessage());
        verify(pelletRepository, times(1)).save(any(PelletEntry.class));
    }

    @Test
    void createOrUpdate_shouldUpdateExistingEntry() {
        PelletEntry existing = new PelletEntry(LocalDate.now(), 3);
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByDateAndUser(testDto.getDate(), testUser)).thenReturn(Optional.of(existing));

        var result = controller.createOrUpdate(testDto, authentication);

        assertEquals("success", result.getStatus());
        assertEquals("Pellet entry updated", result.getMessage());
        verify(pelletRepository, times(1)).save(existing);
    }
}