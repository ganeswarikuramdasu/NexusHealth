package com.nexushealth.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The Node backend never used a single consistent response envelope -
 * different routes returned {success, message, ...extraFields} with the
 * extra fields spread at the top level (e.g. `res.json({ success: true,
 * token, refreshToken, user, profile })`). To keep the JSON shape the React
 * frontend already expects byte-for-byte, this builds a plain ordered map
 * instead of a fixed DTO class per endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse extends LinkedHashMap<String, Object> {

    public static ApiResponse ok() {
        ApiResponse r = new ApiResponse();
        r.put("success", true);
        return r;
    }

    public static ApiResponse ok(String message) {
        ApiResponse r = ok();
        r.put("message", message);
        return r;
    }

    public static ApiResponse fail(String message) {
        ApiResponse r = new ApiResponse();
        r.put("success", false);
        r.put("message", message);
        return r;
    }

    public ApiResponse with(String key, Object value) {
        this.put(key, value);
        return this;
    }

    public ApiResponse withAll(Map<String, Object> values) {
        this.putAll(values);
        return this;
    }
}
