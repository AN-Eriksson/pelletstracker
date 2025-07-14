package me.andreaseriksson.pelletstracker.common;

/**
 * Generic API response wrapper for REST endpoints.
 *
 * @param <T> the type of the response data
 */
public class ApiResponse<T> {
    /**
     * The status of the response (e.g., "success", "error").
     */
    private String status;

    /**
     * A message providing additional information about the response.
     */
    private String message;

    /**
     * The data payload of the response.
     */
    private T data;

    /**
     * Constructs a new ApiResponse with the given status, message, and data.
     *
     * @param status  the status of the response
     * @param message the message of the response
     * @param data    the data payload
     */
    public ApiResponse(String status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    /**
     * Returns the message of the response.
     *
     * @return the message
     */
    public String getMessage() {
        return message;
    }

    /**
     * Sets the message of the response.
     *
     * @param message the message to set
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Returns the status of the response.
     *
     * @return the status
     */
    public String getStatus() {
        return status;
    }

    /**
     * Sets the status of the response.
     *
     * @param status the status to set
     */
    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * Returns the data payload of the response.
     *
     * @return the data
     */
    public T getData() {
        return data;
    }

    /**
     * Sets the data payload of the response.
     *
     * @param data the data to set
     */
    public void setData(T data) {
        this.data = data;
    }
}
