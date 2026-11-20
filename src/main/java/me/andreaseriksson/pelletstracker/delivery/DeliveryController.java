package me.andreaseriksson.pelletstracker.delivery;

import jakarta.validation.Valid;
import me.andreaseriksson.pelletstracker.dto.ApiResponse;
import me.andreaseriksson.pelletstracker.dto.CreatePelletEntryDto;
import me.andreaseriksson.pelletstracker.exception.ResourceNotFoundException;
import me.andreaseriksson.pelletstracker.user.AppUser;
import me.andreaseriksson.pelletstracker.user.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for pellet deliveries, i.e. pellets added to the user's stock.
 * The stock balance and refill forecast are computed in the frontend from deliveries and consumption.
 */
@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryController.class);

    private final PelletDeliveryRepository deliveryRepository;
    private final AppUserRepository appUserRepository;

    public DeliveryController(PelletDeliveryRepository deliveryRepository, AppUserRepository appUserRepository) {
        this.deliveryRepository = deliveryRepository;
        this.appUserRepository = appUserRepository;
    }

    private AppUser getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private PelletDelivery findOwnDelivery(Long id, AppUser user) {
        return deliveryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id " + id));
    }

    /**
     * Retrieves all deliveries for the authenticated user.
     *
     * @param authentication the current authenticated user
     * @return a list of that user's deliveries
     */
    @GetMapping("")
    ApiResponse<List<PelletDelivery>> findAll(Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        return new ApiResponse<>("success", "All deliveries", deliveryRepository.findByUser(currentUser));
    }

    /**
     * Registers a delivery for the authenticated user. Several deliveries on the same date are kept apart.
     *
     * @param dto the date and amount in kilograms
     * @param authentication the current authenticated user
     * @return an ApiResponse containing the created delivery
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("")
    ApiResponse<PelletDelivery> create(@Valid @RequestBody CreatePelletEntryDto dto, Authentication authentication) {
        AppUser currentUser = getCurrentUser(authentication);
        PelletDelivery delivery = new PelletDelivery(dto.getDate(), dto.getAmountKg());
        delivery.setUser(currentUser);

        PelletDelivery saved = deliveryRepository.save(delivery);
        logger.info("LOGGER: Created delivery: {}", saved);
        return new ApiResponse<>("success", "Delivery created", saved);
    }

    /**
     * Updates a delivery of the authenticated user.
     *
     * @param dto the new date and amount in kilograms
     * @param id the ID of the delivery to update
     * @param authentication the current authenticated user
     * @throws ResourceNotFoundException if the user has no delivery with the given ID
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping("/{id}")
    void update(@Valid @RequestBody CreatePelletEntryDto dto, @PathVariable Long id, Authentication authentication) {
        PelletDelivery existing = findOwnDelivery(id, getCurrentUser(authentication));
        existing.setDate(dto.getDate());
        existing.setAmountKg(dto.getAmountKg());
        deliveryRepository.save(existing);
    }

    /**
     * Deletes a delivery of the authenticated user.
     *
     * @param id the ID of the delivery to delete
     * @param authentication the current authenticated user
     * @throws ResourceNotFoundException if the user has no delivery with the given ID
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id, Authentication authentication) {
        deliveryRepository.delete(findOwnDelivery(id, getCurrentUser(authentication)));
    }
}
