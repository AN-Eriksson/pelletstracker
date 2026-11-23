package me.andreaseriksson.pelletstracker.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * An external account (e.g. GitHub) that logs in as an {@link AppUser}. {@code subject} is the provider's
 * fixed user id, never the username, since usernames can change and be reused.
 */
@Entity
@Table(
        name = "user_identities",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_identities_provider_subject", columnNames = {"provider", "subject"})
)
public class UserIdentity {
    public static final String GITHUB = "github";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(nullable = false)
    private String subject;

    protected UserIdentity() {
    }

    public UserIdentity(AppUser user, String provider, String subject) {
        this.user = user;
        this.provider = provider;
        this.subject = subject;
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getProvider() {
        return provider;
    }

    public String getSubject() {
        return subject;
    }
}
