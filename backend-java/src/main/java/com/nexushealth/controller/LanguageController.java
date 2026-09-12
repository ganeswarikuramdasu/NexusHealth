package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.common.ApiException;
import com.nexushealth.common.SupportedLanguages;
import com.nexushealth.entity.User;
import com.nexushealth.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Multilingual language preference endpoints.
 *
 * <p>GET /api/user/language returns the caller's persisted {@code preferredLanguage}
 * plus every supported code + native endonym (the 10-locale registry lives in
 * {@link SupportedLanguages} — one entry there + one frontend locale file).
 *
 * <p>PUT /api/user/language persists the caller's preferred language code, validated
 * against the 10 supported codes before touching the database (so an unsupported
 * code is a clean 400, never a 500).
 *
 * <p>Identity follows the exact convention used across this migration: the caller
 * proves themselves with the {@code x-user-id} header or by sending their userId in
 * the body, and the acting user is resolved via {@link UserRepository#findById(String)}.
 * An unknown/missing identity is a clean 400/404 (ApiException), never a generic 500.
 */
@RestController
@RequestMapping("/api/user/language")
public class LanguageController {

    private final UserRepository userRepository;

    public LanguageController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse getLanguage(
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestParam(required = false) String userId) {
        String uid = userId != null && !userId.isBlank() ? userId : headerUserId;
        if (uid == null || uid.isBlank()) {
            throw ApiException.badRequest(
                    "Missing caller identity. Provide the x-user-id header or a userId.");
        }
        User user = userRepository.findById(uid).orElse(null);
        if (user == null) {
            throw ApiException.notFound("User not found for the given identity.");
        }
        return ApiResponse.ok()
                .with("preferredLanguage", user.getPreferredLanguage())
                .with("supported", SupportedLanguages.codes())
                .with("languages", SupportedLanguages.endonyms());
    }

    @PutMapping
    public ApiResponse setLanguage(
            @RequestHeader(value = "x-user-id", required = false) String headerUserId,
            @RequestBody Map<String, String> body) {
        String bodyUserId = body != null ? body.get("userId") : null;
        String uid = bodyUserId != null && !bodyUserId.isBlank() ? bodyUserId : headerUserId;
        if (uid == null || uid.isBlank()) {
            throw ApiException.badRequest(
                    "Missing caller identity. Provide the x-user-id header or a userId.");
        }
        String code = body != null ? body.get("code") : null;
        if (code != null) {
            code = code.trim().toLowerCase();
        }
        if (code == null || !SupportedLanguages.isSupported(code)) {
            throw ApiException.badRequest("Unsupported language code '" + code
                    + "'. Supported codes: " + String.join(", ", SupportedLanguages.codes()) + ".");
        }
        User user = userRepository.findById(uid).orElse(null);
        if (user == null) {
            throw ApiException.notFound("User not found for the given identity.");
        }
        user.setPreferredLanguage(code);
        userRepository.save(user);
        return ApiResponse.ok("Language preference updated.")
                .with("preferredLanguage", code)
                .with("supported", SupportedLanguages.codes())
                .with("languages", SupportedLanguages.endonyms());
    }
}
