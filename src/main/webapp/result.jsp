<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Check Result</title>
  <link rel="stylesheet" href="styles/main.css">
  <style>
    /* Simple styling for the result page */
    body { display: flex; justify-content: center; align-items: center; height: 100vh; }
    .result-container { padding: 40px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); background-color: #fff; }
    .back-link { display: block; margin-top: 20px; text-align: center; font-size: 1.2rem; }
  </style>
</head>
<body>

<div class="result-container">
  <h2>Check Result</h2>
  <c:set var="lastEntry" value="${sessionScope.history[sessionScope.history.size() - 1]}"/>

  <table id="results-table">
    <thead>
    <tr>
      <th>Parameter</th>
      <th>Value</th>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td>X</td>
      <td>${lastEntry.x}</td>
    </tr>
    <tr>
      <td>Y</td>
      <td>${lastEntry.y}</td>
    </tr>
    <tr>
      <td>R</td>
      <td>${lastEntry.r}</td>
    </tr>
    <tr>
      <td>Result</td>
      <td style="color: ${lastEntry.hit ? 'green' : 'red'}; font-weight: bold;">
        ${lastEntry.hit ? "Hit" : "Miss"}
      </td>
    </tr>
    </tbody>
  </table>

  <a href="${pageContext.request.contextPath}/" class="back-link">← Go Back</a>
</div>

</body>
</html>