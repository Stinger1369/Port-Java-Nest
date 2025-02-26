package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.entity.User;
import com.Portbil.portfolio_backend.service.GoogleMapsService;
import com.Portbil.portfolio_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/google-maps")
public class GoogleMapsController {

    private final GoogleMapsService googleMapsService;
    private final UserService userService;

    public GoogleMapsController(GoogleMapsService googleMapsService, UserService userService) {
        this.googleMapsService = googleMapsService;
        this.userService = userService;
    }

    @PutMapping("/address/{userId}")
    public ResponseEntity<User> updateUserAddress(@PathVariable String userId) {
        User updatedUser = userService.updateUserAddressFromCoordinates(userId);
        return ResponseEntity.ok(updatedUser);
    }
}