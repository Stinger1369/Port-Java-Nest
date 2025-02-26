package com.Portbil.portfolio_backend.controller;

import com.Portbil.portfolio_backend.dto.WeatherDTO;
import com.Portbil.portfolio_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final UserService userService;

    public WeatherController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<WeatherDTO> getWeatherForUser(@PathVariable String userId) {
        WeatherDTO weather = userService.getWeatherForUser(userId);
        return ResponseEntity.ok(weather);
    }
}