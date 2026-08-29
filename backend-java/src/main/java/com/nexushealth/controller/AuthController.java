package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.auth.AuthRequests.*;
import com.nexushealth.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    public ApiResponse sendOtp(@RequestBody SendOtpRequest req) {
        return authService.sendOtp(req);
    }

    @PostMapping("/verify-otp")
    public ApiResponse verifyOtp(@RequestBody VerifyOtpRequest req) {
        return authService.verifyOtp(req);
    }

    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/register-patient")
    public ApiResponse registerPatient(@RequestBody RegisterPatientRequest req) {
        return authService.registerPatient(req);
    }

    @PostMapping("/update-profile-password")
    public ApiResponse updateProfilePassword(@RequestBody UpdateProfilePasswordRequest req) {
        return authService.updateProfilePassword(req);
    }
}
