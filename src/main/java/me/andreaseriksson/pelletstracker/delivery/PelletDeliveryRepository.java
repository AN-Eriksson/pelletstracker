package me.andreaseriksson.pelletstracker.delivery;

import me.andreaseriksson.pelletstracker.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link PelletDelivery} entities, always scoped by the owning {@link AppUser}.
 */
@Repository
public interface PelletDeliveryRepository extends JpaRepository<PelletDelivery, Long> {

    /**
     * Finds all deliveries belonging to a specific user.
     *
     * @param user the owning user
     * @return all deliveries for that user
     */
    List<PelletDelivery> findByUser(AppUser user);

    /**
     * Finds a delivery by id for a specific user.
     *
     * @param id the delivery id
     * @param user the owning user
     * @return an Optional containing the delivery, or empty if not found
     */
    Optional<PelletDelivery> findByIdAndUser(Long id, AppUser user);
}
