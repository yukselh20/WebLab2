package com.hamza.weblab1;

import com.fastcgi.FCGIInterface;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.*;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class Main {

    private static final String SUCCESS_JSON = """
            {
                "sessionId": "%s",
                "hit": %b,
                "execution_time_ns": %d,
                "current_time": "%s",
                "history": [%s]
            }
            """;
    private static final String ERROR_JSON = """
            {
                "error": true,
                "reason": "%s",
                "current_time": "%s"
            }
            """;
    private static final String HISTORY_ENTRY_JSON = """
            {"x":%.2f, "y":%.2f, "r":%.2f, "hit":%b, "execTime":%d, "serverTime":"%s"}""";

    private static final Path SESSIONS_DIR = Paths.get("sessions");
    private static final Gson gson = new Gson();

    record HistoryEntry(float x, float y, float r, boolean hit, long executionTime, String timestamp) {
        public String toJson() {
            return String.format(Locale.US, HISTORY_ENTRY_JSON, x, y, r, hit, executionTime, timestamp);
        }
    }

    public static void main(String[] args) {
        try {
            if (!Files.exists(SESSIONS_DIR)) {
                Files.createDirectories(SESSIONS_DIR);
            }
        } catch (IOException e) {
            e.printStackTrace(System.err);
            return;
        }

        var fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            try {
                String contentLengthStr = System.getProperties().getProperty("CONTENT_LENGTH");
                int contentLength = (contentLengthStr != null) ? Integer.parseInt(contentLengthStr) : 0;
                String postData = "";

                if (contentLength > 0) {
                    InputStreamReader reader = new InputStreamReader(System.in, StandardCharsets.UTF_8);
                    char[] buffer = new char[contentLength];
                    reader.read(buffer, 0, contentLength);
                    postData = new String(buffer);
                }

                Map<String, String> paramsMap = Params.splitQuery(postData);
                String action = paramsMap.getOrDefault("action", "");
                String sessionId = paramsMap.get("sessionId");

                if (action.equals("get_history") || action.equals("clear")) {
                    if (sessionId != null) {
                        if (action.equals("clear")) {
                            clearHistoryForSession(sessionId);
                        }
                        List<HistoryEntry> userHistory = readHistoryForSession(sessionId);
                        sendSuccessResponse(sessionId, false, 0, userHistory);
                    } else {
                        sendSuccessResponse(null, false, 0, new ArrayList<>());
                    }
                    continue;
                }

                var params = new Params(postData);
                sessionId = params.getSessionId();

                if (sessionId == null || sessionId.isBlank()) {
                    sessionId = UUID.randomUUID().toString();
                }

                List<HistoryEntry> userHistory = readHistoryForSession(sessionId);

                var startTime = Instant.now();
                var result = calculate(params.getX(), params.getY(), params.getR());
                var endTime = Instant.now();
                long execTime = ChronoUnit.NANOS.between(startTime, endTime);
                LocalDateTime now = LocalDateTime.now();

                userHistory.add(new HistoryEntry(params.getX(), params.getY(), params.getR(), result, execTime, now.toString()));
                writeHistoryForSession(sessionId, userHistory);

                sendSuccessResponse(sessionId, result, execTime, userHistory);

            } catch (ValidationException e) {
                sendErrorResponse(e.getMessage());
            } catch (Exception e) {
                System.err.println("An unexpected error occurred: " + e.getMessage());
                e.printStackTrace(System.err);
                sendErrorResponse("An internal server error occurred.");
            }
        }
    }

    private static List<HistoryEntry> readHistoryForSession(String sessionId) {
        Path sessionFile = SESSIONS_DIR.resolve(sessionId + ".json");
        if (!Files.exists(sessionFile)) {
            return new ArrayList<>();
        }
        try (Reader reader = new FileReader(sessionFile.toFile())) {
            Type historyType = new TypeToken<ArrayList<HistoryEntry>>() {}.getType();
            List<HistoryEntry> history = gson.fromJson(reader, historyType);
            return (history != null) ? history : new ArrayList<>();
        } catch (IOException e) {
            e.printStackTrace(System.err);
            return new ArrayList<>();
        }
    }

    private static void writeHistoryForSession(String sessionId, List<HistoryEntry> history) {
        Path sessionFile = SESSIONS_DIR.resolve(sessionId + ".json");
        try (Writer writer = new FileWriter(sessionFile.toFile())) {
            gson.toJson(history, writer);
        } catch (IOException e) {
            e.printStackTrace(System.err);
        }
    }

    private static void clearHistoryForSession(String sessionId) {
        Path sessionFile = SESSIONS_DIR.resolve(sessionId + ".json");
        try {
            Files.deleteIfExists(sessionFile);
        } catch (IOException e) {
            e.printStackTrace(System.err);
        }
    }

    private static void sendSuccessResponse(String sessionId, boolean hit, long execTime, List<HistoryEntry> history) {
        StringBuilder historyJson = new StringBuilder();
        for (int i = 0; i < history.size(); i++) {
            historyJson.append(history.get(i).toJson());
            if (i < history.size() - 1) {
                historyJson.append(",");
            }
        }
        String body = String.format(Locale.US, SUCCESS_JSON, sessionId, hit, execTime, LocalDateTime.now(), historyJson);
        String response = "Content-Type: application/json\r\n" + "Content-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n" + "\r\n" + body;
        System.out.println(response);
    }

    private static void sendErrorResponse(String reason) {
        String body = String.format(ERROR_JSON, reason, LocalDateTime.now());
        String response = "Status: 400 Bad Request\r\n" + "Content-Type: application/json\r\n" + "Content-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n" + "\r\n" + body;
        System.out.println(response);
    }

    private static boolean calculate(float x, float y, float r) {
        if (x >= 0 && y >= 0) { return y <= (-2 * x + r); }
        if (x < 0 && y > 0) { return false; }
        if (x < 0 && y <= 0) { return (x * x + y * y) <= (r * r); }
        if (x >= 0 && y < 0) { return (x <= r) && (y >= -r); }
        return false;
    }
}