package com.nexushealth.common;

import java.util.regex.Pattern;

public final class PasswordValidator {

    private static final Pattern UPPER = Pattern.compile("[A-Z]");
    private static final Pattern LOWER = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    private PasswordValidator() {
    }

    public record Result(boolean valid, String message) {
    }

    public static Result validate(String password) {
        if (password == null || password.length() < 8) {
            return new Result(false, "Password must be at least 8 characters long.");
        }
        if (!UPPER.matcher(password).find()) {
            return new Result(false, "Password must contain at least one uppercase letter (A-Z).");
        }
        if (!LOWER.matcher(password).find()) {
            return new Result(false, "Password must contain at least one lowercase letter (a-z).");
        }
        if (!DIGIT.matcher(password).find()) {
            return new Result(false, "Password must contain at least one number (0-9).");
        }
        if (!SPECIAL.matcher(password).find()) {
            return new Result(false, "Password must contain at least one special character (!@#$%^&* etc.).");
        }
        return new Result(true, "Password meets security requirements.");
    }
}
