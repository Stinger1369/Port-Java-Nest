package com.Portbil.portfolio_backend.service;

import com.Portbil.portfolio_backend.dto.WeatherDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WeatherService {

    @Value("${openweathermap.api-key}")
    private String apiKey;

    @Value("${openweathermap.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;

    public WeatherService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public WeatherDTO getWeather(Double latitude, Double longitude) {
        String url = String.format("%s?lat=%f&lon=%f&appid=%s&units=metric", baseUrl, latitude, longitude, apiKey);
        WeatherResponse response = restTemplate.getForObject(url, WeatherResponse.class);

        if (response == null) {
            throw new IllegalStateException("Impossible de récupérer les données météo.");
        }

        return new WeatherDTO(
                response.getMain().getTemp(),
                response.getWeather()[0].getDescription(),
                response.getMain().getHumidity()
        );
    }

    private static class WeatherResponse {
        private Main main;
        private Weather[] weather;

        public Main getMain() { return main; }
        public void setMain(Main main) { this.main = main; }
        public Weather[] getWeather() { return weather; }
        public void setWeather(Weather[] weather) { this.weather = weather; }

        public static class Main {
            private double temp;
            private int humidity;

            public double getTemp() { return temp; }
            public void setTemp(double temp) { this.temp = temp; }
            public int getHumidity() { return humidity; }
            public void setHumidity(int humidity) { this.humidity = humidity; }
        }

        public static class Weather {
            private String description;

            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
        }
    }
}