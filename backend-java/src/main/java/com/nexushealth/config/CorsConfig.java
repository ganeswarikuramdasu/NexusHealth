package com.nexushealth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The original Node backend served the React app AND the API from the same
 * Express process/port, so no CORS was needed. Spring Boot only serves the
 * API (see README for the two ways to run the frontend against it), so in
 * dev the browser talks to a different origin (Vite on :5173) than the API
 * (Spring Boot on :8080) - CORS has to be explicitly allowed for that to work.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${nexushealth.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
