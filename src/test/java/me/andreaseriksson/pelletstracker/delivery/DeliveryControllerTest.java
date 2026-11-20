package me.andreaseriksson.pelletstracker.delivery;

import me.andreaseriksson.pelletstracker.dto.CreatePelletEntryDto;
import me.andreaseriksson.pelletstracker.exception.ResourceNotFoundException;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryControllerTest {

    @Mock
    private PelletDeliveryRepository deliveryRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private DeliveryController controller;

    private AppUser testUser;
    private CreatePelletEntryDto testDto;

    @BeforeEach
    void setUp() {
        testUser = new AppUser();
        testUser.setUsername("testuser");

        testDto = new CreatePelletEntryDto();
        testDto.setDate(LocalDate.now());
        testDto.setAmountKg(960);

        when(authentication.getName()).thenReturn("testuser");
        when(appUserRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
    }

    @Test
    void create_shouldSaveDeliveryOwnedByCurrentUser() {
        when(deliveryRepository.save(any(PelletDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = controller.create(testDto, authentication);

        ArgumentCaptor<PelletDelivery> saved = ArgumentCaptor.forClass(PelletDelivery.class);
        verify(deliveryRepository).save(saved.capture());
        assertSame(testUser, saved.getValue().getUser());
        assertEquals(960, saved.getValue().getAmountKg());
        assertEquals("Delivery created", result.getMessage());
    }

    @Test
    void update_ofAnotherUsersDelivery_shouldThrowNotFound() {
        when(deliveryRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> controller.update(testDto, 1L, authentication));
        verify(deliveryRepository, never()).save(any(PelletDelivery.class));
    }

    @Test
    void delete_shouldRemoveOwnDelivery() {
        PelletDelivery delivery = new PelletDelivery(LocalDate.now(), 480);
        when(deliveryRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(delivery));

        controller.delete(1L, authentication);

        verify(deliveryRepository).delete(delivery);
    }
}
