package com.hamza.weblab2.servlets;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

public class ControllerServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Forward all GET requests to the main page
        getServletContext().getRequestDispatcher("/index.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");

        // Handle the clear history action
        if ("clear".equals(action)) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"History cleared.\"}");
            return;
        }

        // Check for parameters from either the form submission or the graph click
        String xParam = request.getParameter("x");
        String xHiddenParam = request.getParameter("x_hidden"); // Check for the click parameter
        String yParam = request.getParameter("y");
        String rParam = request.getParameter("r");

        // *** THE FIX IS HERE ***
        // The condition now checks for 'x' (from radio buttons) OR 'x_hidden' (from graph click).
        if ((xParam != null || xHiddenParam != null) && yParam != null && rParam != null) {
            // If we have the necessary parameters, forward to the AreaCheckServlet
            getServletContext().getRequestDispatcher("/area-check").forward(request, response);
        } else {
            // Otherwise, just show the main page (e.g., if the form is submitted with missing data)
            getServletContext().getRequestDispatcher("/index.jsp").forward(request, response);
        }
    }
}