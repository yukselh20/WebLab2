package com.hamza.weblab1;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

class Params {
    private final float x;
    private final float y;
    private final float r;
    private final String sessionId;

    public Params(String data) throws ValidationException {
        if (data == null || data.isEmpty()) {
            throw new ValidationException("Missing request data");
        }
        var paramsMap = splitQuery(data);
        validateParams(paramsMap);
        this.x = Float.parseFloat(paramsMap.get("x"));
        this.y = Float.parseFloat(paramsMap.get("y").replace(',', '.'));
        this.r = Float.parseFloat(paramsMap.get("r"));
        this.sessionId = paramsMap.get("sessionId");
    }

    public static Map<String, String> splitQuery(String query) {
        if (query == null || query.isEmpty()) {
            return new HashMap<>();
        }
        return Arrays.stream(query.split("&"))
                .map(pair -> pair.split("=", 2))
                .filter(pair -> pair.length == 2)
                .collect(
                        Collectors.toMap(
                                pairParts -> URLDecoder.decode(pairParts[0], StandardCharsets.UTF_8),
                                pairParts -> URLDecoder.decode(pairParts[1], StandardCharsets.UTF_8),
                                (a, b) -> b,
                                HashMap::new
                        )
                );
    }

    private static void validateParams(Map<String, String> params) throws ValidationException {
        String xStr = params.get("x");
        if (xStr == null || xStr.isEmpty()) {
            throw new ValidationException("x is invalid");
        }
        try {
            float x = Float.parseFloat(xStr);
            if (x < -2 || x > 2) {
                throw new ValidationException("x has an out of range value");
            }
        } catch (NumberFormatException e) {
            throw new ValidationException("x is not a number");
        }

        String yStr = params.get("y");
        if (yStr == null || yStr.isEmpty()) {
            throw new ValidationException("y is invalid");
        }
        try {
            float y = Float.parseFloat(yStr.replace(',', '.'));
            if (y < -5 || y > 5) {
                throw new ValidationException("y has an out of range value");
            }
        } catch (NumberFormatException e) {
            throw new ValidationException("y is not a number");
        }

        String rStr = params.get("r");
        if (rStr == null || rStr.isEmpty()) {
            throw new ValidationException("r is invalid");
        }
        try {
            float r = Float.parseFloat(rStr);
            if (r < 1 || r > 3) {
                throw new ValidationException("r has an out of range value");
            }
        } catch (NumberFormatException e) {
            throw new ValidationException("r is not a number");
        }
    }

    public float getX() { return x; }
    public float getY() { return y; }
    public float getR() { return r; }
    public String getSessionId() { return sessionId; }
}