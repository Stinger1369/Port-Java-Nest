package com.Portbil.portfolio_backend.exception;

import com.Portbil.portfolio_backend.model.ErrorResponse;
import org.springframework.http.HttpStatus;

public class GoApiException extends RuntimeException {
    private final HttpStatus status;
    private final ErrorResponse errorResponse;

    public GoApiException(HttpStatus status, ErrorResponse errorResponse) {
        super(errorResponse.getError());
        this.status = status;
        this.errorResponse = errorResponse;
    }

    public HttpStatus getStatus() { return status; }
    public ErrorResponse getErrorResponse() { return errorResponse; }
}