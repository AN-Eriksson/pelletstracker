package me.andreaseriksson.pelletstracker.user;

/** The cap on new accounts per day (REGISTRATION_DAILY_LIMIT) is reached. */
public class RegistrationLimitException extends RuntimeException {
    public RegistrationLimitException(int limit) {
        super("Registration limit of " + limit + " new accounts per day reached");
    }
}
