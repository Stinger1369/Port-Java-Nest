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
                response.getMain().getTemp(),           // Température
                response.getWeather()[0].getDescription(), // Description
                response.getMain().getHumidity(),      // Humidité
                response.getName(),                    // Ville
                response.getMain().getPressure(),      // Pression
                response.getWind().getSpeed() * 3.6,   // Vitesse du vent (m/s -> km/h)
                response.getWind().getDeg(),           // Direction du vent
                response.getMain().getFeelsLike(),     // Température ressentie
                response.getVisibility(),              // Visibilité (mètres)
                response.getSys().getSunrise(),        // Lever du soleil
                response.getSys().getSunset(),         // Coucher du soleil
                response.getUvi()                      // Indice UV (nécessite l'API One Call pour précision)
        );
    }

    private static class WeatherResponse {
        private Main main;
        private Weather[] weather;
        private String name;
        private Wind wind;
        private Sys sys;
        private int visibility;
        private int uvi; // Indice UV (optionnel, dépend de l'API utilisée)

        public Main getMain() { return main; }
        public void setMain(Main main) { this.main = main; }
        public Weather[] getWeather() { return weather; }
        public void setWeather(Weather[] weather) { this.weather = weather; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Wind getWind() { return wind; }
        public void setWind(Wind wind) { this.wind = wind; }
        public Sys getSys() { return sys; }
        public void setSys(Sys sys) { this.sys = sys; }
        public int getVisibility() { return visibility; }
        public void setVisibility(int visibility) { this.visibility = visibility; }
        public int getUvi() { return uvi; }
        public void setUvi(int uvi) { this.uvi = this.uvi; }

        public static class Main {
            private double temp;
            private int humidity;
            private double pressure;
            private double feelsLike;

            public double getTemp() { return temp; }
            public void setTemp(double temp) { this.temp = temp; }
            public int getHumidity() { return humidity; }
            public void setHumidity(int humidity) { this.humidity = humidity; }
            public double getPressure() { return pressure; }
            public void setPressure(double pressure) { this.pressure = pressure; }
            public double getFeelsLike() { return feelsLike; }
            public void setFeelsLike(double feelsLike) { this.feelsLike = feelsLike; }
        }

        public static class Weather {
            private String description;

            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }
        }

        public static class Wind {
            private double speed;
            private int deg;

            public double getSpeed() { return speed; }
            public void setSpeed(double speed) { this.speed = speed; }
            public int getDeg() { return deg; }
            public void setDeg(int deg) { this.deg = deg; }
        }

        public static class Sys {
            private long sunrise;
            private long sunset;

            public long getSunrise() { return sunrise; }
            public void setSunrise(long sunrise) { this.sunrise = sunrise; }
            public long getSunset() { return sunset; }
            public void setSunset(long sunset) { this.sunset = sunset; }
        }
    }
}