package com.Portbil.portfolio_backend.model;

public class ErrorResponse {
    private String code;
    private String error;

    // Constructeurs, getters, setters, toString
    public ErrorResponse() {}

    public ErrorResponse(String code, String error) {
        this.code = code;
        this.error = error;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    @Override
    public String toString() {
        return "ErrorResponse{code='" + code + "', error='" + error + "'}";
    }
}