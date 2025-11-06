<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web Lab 2</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/styles/main.css">
    <script>
        const historyPoints = [
            <c:forEach var="entry" items="${sessionScope.history}" varStatus="loop">
            {
                x: ${entry.x},
                y: ${entry.y},
                r: ${entry.r},
                hit: ${entry.hit}
            }${!loop.last ? ',' : ''}
            </c:forEach>
        ];
    </script>
</head>
<body>

<div class="header">
    <h1>Yuksel Hamza</h1>
    <h2>Group P3232 | Variant 7485</h2>
</div>

<div class="container">
    <div class="panel" id="left-panel">
        <canvas id="graph" width="300" height="300"></canvas>
        <form id="coordinates-form" method="POST" action="controller">
            <!-- X coordinate buttons -->
            <div class="form-group">
                <label>Select X:</label>
                <div class="button-group">
                    <c:forEach var="i" items="${[-5, -4, -3, -2, -1, 0, 1, 2, 3]}">
                        <label><input type="radio" name="x" value="${i}" <c:if test="${i eq 0}">checked</c:if>> ${i}</label>
                    </c:forEach>
                </div>
            </div>

            <div class="form-group">
                <label for="y-text">Enter Y (-3 ... 3):</label>
                <input type="text" id="y-text" name="y" placeholder="e.g., 1.23" maxlength="15">
            </div>

            <input type="hidden" id="x-hidden" name="x_hidden">

            <div class="form-group">
                <label>Select R:</label>
                <div class="button-group">
                    <c:forEach var="i" items="${[1, 2, 3, 4, 5]}">
                        <label><input type="radio" name="r" value="${i}" <c:if test="${i eq 1}">checked</c:if>> ${i}</label>
                    </c:forEach>
                </div>
            </div>

            <div id="error-container" style="${not empty errorMessage ? 'display: block;' : ''}">
                <c:if test="${not empty errorMessage}">
                    ${errorMessage}
                </c:if>
            </div>


            <div class="form-buttons">
                <button type="submit">Check</button>
                <button type="reset">Reset</button>
                <button type="button" id="clear-history-button">Clear History</button>
            </div>
        </form>
    </div>

    <div class="panel" id="right-panel">
        <h2>Results</h2>
        <div class="table-container">
            <table id="results-table">
                <thead>
                <tr>
                    <th>X</th>
                    <th>Y</th>
                    <th>R</th>
                    <th>Result</th>
                    <th>Server Time</th>
                    <th>Execution Time (ms)</th>
                </tr>
                </thead>
                <tbody id="results-body">
                <c:forEach var="entry" items="${sessionScope.history}">
                    <tr>
                        <td>${entry.x}</td>
                        <td>${entry.y}</td>
                        <td>${entry.r}</td>
                        <td style="color: ${entry.hit ? 'green' : 'red'}">
                                ${entry.hit ? "Hit" : "Miss"}
                        </td>
                        <td>${entry.serverTime}</td>
                        <td><fmt:formatNumber value="${entry.executionTimeMs}" maxFractionDigits="4"/></td>
                    </tr>
                </c:forEach>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
    const contextPath = "${pageContext.request.contextPath}";
</script>

<script src="${pageContext.request.contextPath}/script.js"></script>

</body>
</html>