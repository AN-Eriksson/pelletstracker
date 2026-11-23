package me.andreaseriksson.pelletstracker.pellet;

import me.andreaseriksson.pelletstracker.dto.CreatePelletEntryDto;
import me.andreaseriksson.pelletstracker.exception.ConflictException;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

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
        testDto.setAmountKg(80);
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
        PelletEntry existing = new PelletEntry(LocalDate.now(), 48);
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByDateAndUser(testDto.getDate(), testUser)).thenReturn(Optional.of(existing));

        var result = controller.createOrUpdate(testDto, authentication);

        assertEquals("success", result.getStatus());
        assertEquals("Pellet entry updated", result.getMessage());
        verify(pelletRepository, times(1)).save(existing);
    }

    @Test
    void update_toDateOfAnotherEntry_shouldThrowConflict() {
        PelletEntry editing = entryWithId(1L, LocalDate.now().minusDays(1), 32);
        PelletEntry other = entryWithId(2L, testDto.getDate(), 16);
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(editing));
        when(pelletRepository.findByDateAndUser(testDto.getDate(), testUser)).thenReturn(Optional.of(other));

        assertThrows(ConflictException.class, () -> controller.update(testDto, 1L, authentication));
        verify(pelletRepository, never()).save(any(PelletEntry.class));
    }

    @Test
    void update_keepingItsOwnDate_shouldSave() {
        PelletEntry editing = entryWithId(1L, testDto.getDate(), 32);
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(editing));
        when(pelletRepository.findByDateAndUser(testDto.getDate(), testUser)).thenReturn(Optional.of(editing));

        controller.update(testDto, 1L, authentication);

        assertEquals(80, editing.getAmountKg());
        verify(pelletRepository, times(1)).save(editing);
    }

    @Test
    void exportCsv_shouldReturnOnlyTheCurrentUsersEntriesAsAttachment() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Europe/Stockholm"));
        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(pelletRepository.findByUser(testUser)).thenReturn(java.util.List.of(new PelletEntry(today, 24)));

        var response = controller.exportCsv(authentication);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("text/csv;charset=UTF-8", response.getHeaders().getContentType().toString());
        assertEquals("attachment; filename=\"pelletstracker-forbrukning-" + today + ".csv\"",
                response.getHeaders().getFirst("Content-Disposition"));
        assertEquals(today + ";1,5\r\n", response.getBody());
        verify(pelletRepository).findByUser(testUser);
    }

    private static PelletEntry entryWithId(Long id, LocalDate date, int amountKg) {
        PelletEntry entry = new PelletEntry(date, amountKg);
        ReflectionTestUtils.setField(entry, "id", id);
        return entry;
    }
}
