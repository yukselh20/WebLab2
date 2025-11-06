package com.hamza.weblab2.servlets;

import com.google.gson.Gson;
import com.hamza.weblab2.model.HistoryEntry;
import com.hamza.weblab2.utils.HitChecker;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal; // Ensure BigDecimal is imported
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class AreaCheckServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        long startTime = System.nanoTime();
        HttpSession session = request.getSession();

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String xString = request.getParameter("x_hidden"); // Check for hidden click value first
        if (xString == null || xString.isEmpty()) {
            xString = request.getParameter("x"); // Fallback to radio button value
        }

        if (!isValid(request, xString)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, String> error = Map.of("error", "Invalid or out-of-range parameters.");
            out.print(gson.toJson(error));
            out.flush();
            return;
        }

        // THE FIX: Create BigDecimal objects from the start.
        BigDecimal x = new BigDecimal(xString.replace(',', '.'));
        BigDecimal y = new BigDecimal(request.getParameter("y").replace(',', '.'));
        BigDecimal r = new BigDecimal(request.getParameter("r"));

        // Now the types match what HitChecker expects.
        boolean isHit = HitChecker.isHit(x, y, r);
        long executionTime = System.nanoTime() - startTime;

        // Create the HistoryEntry bean with the correct BigDecimal types.
        HistoryEntry newEntry = new HistoryEntry(x, y, r, isHit, executionTime);

        @SuppressWarnings("unchecked")
        List<HistoryEntry> history = (List<HistoryEntry>) session.getAttribute("history");
        if (history == null) {
            history = new ArrayList<>();
        }
        history.add(newEntry);
        session.setAttribute("history", history);

        String jsonHistory = gson.toJson(history);
        out.print(jsonHistory);
        out.flush();
    }

    private boolean isValid(HttpServletRequest request, String xString) {
        try {
            // Validate X as a range
            if (xString == null || xString.isEmpty()) return false;
            BigDecimal x = new BigDecimal(xString.replace(',', '.'));
            if (x.compareTo(new BigDecimal("-5")) < 0 || x.compareTo(new BigDecimal("3")) > 0) {
                return false;
            }

            // Validate Y as a range
            String yString = request.getParameter("y");
            if (yString == null || yString.isEmpty()) return false;
            BigDecimal y = new BigDecimal(yString.replace(',', '.'));
            if (y.compareTo(new BigDecimal("-3")) <= 0 || y.compareTo(new BigDecimal("3")) >= 0) {
                return false;
            }

            // Validate R from the list
            BigDecimal r = new BigDecimal(request.getParameter("r"));
            List<BigDecimal> allowedR = Arrays.asList(
                    new BigDecimal("1"), new BigDecimal("2"), new BigDecimal("3"),
                    new BigDecimal("4"), new BigDecimal("5")
            );
            if (!allowedR.contains(r)) return false;

            return true;
        } catch (NumberFormatException | NullPointerException e) {
            return false;
        }
    }
}