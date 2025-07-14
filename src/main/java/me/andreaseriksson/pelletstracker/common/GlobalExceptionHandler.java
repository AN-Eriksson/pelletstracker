package me.andreaseriksson.pelletstracker.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for REST controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Logger instance for this global exception handler.
     */
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles all uncaught exceptions and returns a standardized error response.
     *
     * @param ex the exception that was thrown
     * @return an ApiResponse with error status and a generic error message
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<String> handleAllExceptions(Exception ex) {
        logger.error("Unhandled exception caught", ex);
        return new ApiResponse<>("error", "An unexpected error occurred. Please try again later.", null);
    }
}
