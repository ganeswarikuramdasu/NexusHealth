package com.nexushealth.common;

import org.springframework.http.HttpStatus;

/**
 * Thrown by services to signal a business-rule failure that should become a
 * `{ success: false, message }` JSON response with a specific HTTP status -
 * mirrors the `res.status(xxx).json({ success: false, message })` pattern
 * used throughout every Node route handler.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public HttpStatus getStatus() {
        return status;
    }
}
