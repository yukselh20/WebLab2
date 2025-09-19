package com.hamza.weblab1; // Paket adınla güncel

import com.google.gson.Gson;
import com.fastcgi.FCGIInterface;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    // Sonuçları saklayacağımız ve istekler arasında korunacak olan liste
    private static final List<Result> history = Collections.synchronizedList(new ArrayList<>());
    private static final Gson gson = new Gson();

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();

        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.nanoTime(); // İşlem başlangıç zamanı

            // 1. İSTEĞİ OKU VE PARAMETRELERİ AYRIŞTIR
            Map<String, String> params = parseRequestBody();

            String xStr = params.get("x");
            String yStr = params.get("y");
            String rStr = params.get("r");

            // 2. SUNUCU TARAFLI DOĞRULAMA
            if (isValid(xStr, yStr, rStr)) {
                double x = Double.parseDouble(xStr);
                double y = Double.parseDouble(yStr.replace(',', '.'));
                double r = Double.parseDouble(rStr);

                // 3. HESAPLAMA YAP
                boolean isHit = checkHit(x, y, r);

                // 4. SONUCU GEÇMİŞE EKLE
                double processingTime = (System.nanoTime() - startTime) / 1000.0; // mikrosaniye'ye çevir
                String attemptTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                Result result = new Result(x, y, r, isHit, attemptTime, processingTime);
                history.add(result);
            }

            // 5. CEVABI OLUŞTUR VE GÖNDER
            sendResponse();
        }
    }

    // Gelen isteğin gövdesini (body) okuyup x, y, r parametrelerini bir Map'e dönüştürür.
    private static Map<String, String> parseRequestBody() {
        Map<String, String> params = new HashMap<>();
        try {
            ByteArrayOutputStream result = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int length;
            while ((length = System.in.read(buffer)) != -1) {
                result.write(buffer, 0, length);
            }
            String body = result.toString(StandardCharsets.UTF_8);

            for (String param : body.split("&")) {
                String[] pair = param.split("=");
                if (pair.length > 1) {
                    params.put(pair[0], URLDecoder.decode(pair[1], StandardCharsets.UTF_8));
                }
            }
        } catch (IOException e) {
            // Hata durumunda loglama yapılabilir. Şimdilik boş bırakıyoruz.
        }
        return params;
    }

    // Parametrelerin geçerli olup olmadığını kontrol eder.
    private static boolean isValid(String x, String y, String r) {
        if (x == null || y == null || r == null) return false;
        try {
            double yVal = Double.parseDouble(y.replace(',', '.'));
            return yVal >= -5 && yVal <= 5;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    // Faz 1'de tanımladığımız matematiksel mantık.
    private static boolean checkHit(double x, double y, double r) {
        // Üçgen (Sağ Üst)
        if (x >= 0 && y >= 0) {
            return y <= -2 * x + r;
        }
        // Dikdörtgen (Sağ Alt)
        if (x >= 0 && y <= 0) {
            return x <= r && y >= -r;
        }
        // Çeyrek Daire (Sol Alt)
        if (x <= 0 && y <= 0) {
            return (x * x + y * y) <= (r * r);
        }
        // Boş Alan (Sol Üst)
        return false;
    }

    // JSON cevabını oluşturup tarayıcıya gönderir.
    private static void sendResponse() {
        System.out.print("Content-type: application/json\r\n");
        System.out.print("\r\n");

        Map<String, Object> response = new HashMap<>();
        response.put("history", history);
        System.out.print(gson.toJson(response));
    }

    // Sonuçları tutmak için veri sınıfı.
    private static class Result {
        private final double x, y, r;
        private final boolean hit;
        private final String attemptTime;
        private final double processingTime;

        public Result(double x, double y, double r, boolean hit, String attemptTime, double processingTime) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.hit = hit;
            this.attemptTime = attemptTime;
            this.processingTime = processingTime;
        }
    }
}