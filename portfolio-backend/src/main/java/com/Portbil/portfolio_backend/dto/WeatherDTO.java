package com.Portbil.portfolio_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDTO {
    private double temperature;       // Température actuelle (°C)
    private String description;       // Description (ex. "ciel dégagé")
    private int humidity;             // Humidité (%)
    private String city;              // Nom de la ville
    private double pressure;          // Pression atmosphérique (hPa)
    private double windSpeed;         // Vitesse du vent (km/h)
    private int windDirection;        // Direction du vent (degrés, 0-360)
    private double feelsLike;         // Température ressentie (°C)
    private int visibility;           // Visibilité (mètres)
    private long sunrise;             // Heure du lever du soleil (timestamp UNIX)
    private long sunset;              // Heure du coucher du soleil (timestamp UNIX)
    private int uvIndex;              // Indice UV (0-11+)
}