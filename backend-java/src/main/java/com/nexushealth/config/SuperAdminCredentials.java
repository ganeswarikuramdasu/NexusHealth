package com.nexushealth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminCredentials {

    @Value("${nexushealth.super-admin.email}")
    private String email;

    @Value("${nexushealth.super-admin.password}")
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

