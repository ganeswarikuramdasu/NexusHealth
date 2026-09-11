package com.nexushealth.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Mirrors the Node catch-all `app.all("/api/*", ...)` 404 handler.
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse> handleNotFound(NoHandlerFoundException ex) {
        ApiResponse body = ApiResponse.fail(
                "API endpoint " + ex.getHttpMethod() + " " + ex.getRequestURL() + " not found.");
        body.put("error", "ENDPOINT_NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ApiResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Invalid request.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(message));
    }

    // Malformed / unreadable JSON body - clean 400 instead of leaking Jackson
    // parser internals in a 500.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("Malformed or invalid request body."));
    }

    // Date / number parsing failures that escaped service-level guarding produce
    // a clean 400 instead of a generic 500.
    @ExceptionHandler({java.time.format.DateTimeParseException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiResponse> handleBadRequestValue(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail("Invalid request value provided. Check date fields (YYYY-MM-DD) and numeric fields."));
    }

    // FK / unique violations leak raw DB messages; map them to a clean 409/400.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("This operation conflicts with existing data (e.g. a foreign key or duplicate value)."));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getMessage())
                .orElse("Invalid request values.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(message));
    }

    @ExceptionHandler(JpaSystemException.class)
    public ResponseEntity<ApiResponse> handleJpa(JpaSystemException ex) {
        if (ex.getMostSpecificCause() instanceof DataIntegrityViolationException) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("This operation conflicts with existing data."));
        }
        throw ex;
    }

    // Fallback that never leaks internal exception details to the client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        ApiResponse body = ApiResponse.fail("An unexpected server error occurred. Please try again.");
        body.put("error", "INTERNAL_SERVER_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
