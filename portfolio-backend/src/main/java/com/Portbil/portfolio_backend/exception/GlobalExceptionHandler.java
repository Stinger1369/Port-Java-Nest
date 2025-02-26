package com.Portbil.portfolio_backend.exception;

import com.Portbil.portfolio_backend.model.ErrorResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map; // Réintroduit pour compatibilité, même si non utilisé ici

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GoApiException.class)
    public ResponseEntity<ErrorResponse> handleGoApiException(GoApiException ex) {
        return new ResponseEntity<>(ex.getErrorResponse(), ex.getStatus());
    }

    @ExceptionHandler(JsonProcessingException.class)
    public ResponseEntity<ErrorResponse> handleJsonProcessingException(JsonProcessingException ex) {
        ErrorResponse error = new ErrorResponse("ERR997", "Error parsing JSON: " + ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse("ERR999", "Internal server error: " + ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}