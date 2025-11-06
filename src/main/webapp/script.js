"use strict";
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Definitions ---
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    const form = document.getElementById('coordinates-form');
    const yInput = document.getElementById('y-text');
    const xHiddenInput = document.getElementById('x-hidden');
    const errorContainer = document.getElementById('error-container');
    const resultsTableBody = document.getElementById('results-body');
    const clearHistoryButton = document.getElementById('clear-history-button');

    // --- Dynamic Graph State & Timers ---
    let scale = 40;
    let origin = { x: canvas.width / 2, y: canvas.height / 2 };
    let isPanning = false;
    let hasDragged = false;
    let panStart = { x: 0, y: 0 };
    let errorTimeout = null; // To hold the timer for the error message

    // --- Coordinate Conversion Helpers ---
    function toPixels(mathX, mathY) {
        return { x: origin.x + mathX * scale, y: origin.y - mathY * scale };
    }
    function toMath(pixelX, pixelY) {
        return { x: (pixelX - origin.x) / scale, y: (origin.y - pixelY) / scale };
    }

    // --- Input Filtering ---
    function filterYInput(event) {
        const key = event.key;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) return;
        if (key === '-' && event.target.selectionStart === 0 && !event.target.value.includes('-')) return;
        const isDecimalSeparator = key === '.' || key === ',';
        const hasDecimalSeparator = event.target.value.includes('.') || event.target.value.includes(',');
        if (isDecimalSeparator && !hasDecimalSeparator) return;
        if (/[0-9]/.test(key)) return;
        event.preventDefault();
    }
    yInput.addEventListener('keydown', filterYInput);

    // --- Core Drawing and UI Update Functions ---
    function drawGraph(rValue, points = []) {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gridStep = scale;
        for (let x = origin.x % gridStep; x < w; x += gridStep) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = origin.y % gridStep; y < h; y += gridStep) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, origin.y); ctx.lineTo(w, origin.y);
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, h);
        ctx.stroke();

        if (rValue) {
            ctx.fillStyle = 'rgba(70, 130, 180, 0.7)';
            const p00 = toPixels(0, 0);

            // 1st Q: Quarter-circle
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.arc(p00.x, p00.y, rValue * scale, -Math.PI / 2, 0, false);
            ctx.closePath();
            ctx.fill();

            // 2nd Q: Rectangle
            const p_neg_r_0 = toPixels(-rValue, 0);
            const p_0_r_half = toPixels(0, rValue / 2);
            ctx.fillRect(p_neg_r_0.x, p_0_r_half.y, rValue * scale, (rValue / 2) * scale);

            // 3rd Q: Triangle
            const p_neg_r_half_0 = toPixels(-rValue / 2, 0);
            const p0_neg_r = toPixels(0, -rValue);
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.lineTo(p_neg_r_half_0.x, p_neg_r_half_0.y);
            ctx.lineTo(p0_neg_r.x, p0_neg_r.y);
            ctx.closePath();
            ctx.fill();
        }

        points.forEach(point => {
            const p = toPixels(point.x, point.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = point.hit ? 'green' : 'red';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        });
    }

    function updateTable(history) {
        resultsTableBody.innerHTML = '';
        if (!history) return;
        history.slice().reverse().forEach(entry => {
            const newRow = resultsTableBody.insertRow();
            newRow.innerHTML = `
                <td>${Number(entry.x).toFixed(4)}</td>
                <td>${Number(entry.y).toFixed(4)}</td>
                <td>${Number(entry.r)}</td>
                <td style="color: ${entry.hit ? 'green' : 'red'}">${entry.hit ? "Hit" : "Miss"}</td>
                <td>${entry.serverTime}</td>
                <td>${Number(entry.executionTimeMs).toFixed(4)}</td>
            `;
        });
    }

    // *** MODIFIED showError FUNCTION ***
    function showError(message) {
        // Clear any previous timer to prevent premature hiding of the new message
        clearTimeout(errorTimeout);
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        // Set a new timer to hide this message after 5 seconds
        errorTimeout = setTimeout(hideError, 5000);
    }

    function hideError() {
        errorContainer.style.display = 'none';
    }

    function redrawGraphWithHistory() {
        const selectedRRadio = form.querySelector('input[name="r"]:checked');
        const rValue = selectedRRadio ? parseFloat(selectedRRadio.value) : null;
        drawGraph(rValue, window.historyPoints || []);
    }

    // --- Main Asynchronous Submission Logic ---
    async function submitCheck(params) {
        try {
            const response = await fetch(`${contextPath}/controller`, { method: 'POST', body: params });
            if (response.ok) {
                const newHistory = await response.json();
                window.historyPoints = newHistory;
                updateTable(newHistory);
                redrawGraphWithHistory();
            } else {
                const errorData = await response.json();
                showError(errorData.error || 'An unknown server error occurred.');
            }
        } catch (error) {
            console.error("An error occurred during fetch:", error);
            showError('Error processing request. Check console for details.');
        }
    }

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();
        xHiddenInput.value = '';

        const yValueStr = yInput.value.trim();
        const yNormalized = yValueStr.replace(',', '.');
        const selectedX = form.querySelector('input[name="x"]:checked');
        const selectedR = form.querySelector('input[name="r"]:checked');
        let errors = [];
        if (!selectedX) { errors.push('Please select an X value.'); }
        if (yValueStr === '') { errors.push('Y value cannot be empty.'); }
        else if (!/^-?\d+([.,]\d+)?$/.test(yValueStr)) { errors.push('Y must be a valid number (e.g., -2.123).'); }
        else {
            const yValue = parseFloat(yNormalized);
            if (yValue <= -3 || yValue >= 3) { errors.push('Y must be in the range (-3 ... 3).'); }
        }
        if (!selectedR) { errors.push('Please select an R value.'); }
        if (errors.length > 0) {
            showError(errors.join(' '));
            return;
        }

        const params = new URLSearchParams(new FormData(form));
        submitCheck(params);
    });

    clearHistoryButton.addEventListener('click', async () => {
        hideError();
        try {
            const response = await fetch(`${contextPath}/controller`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=clear'
            });
            if (response.ok) {
                window.historyPoints = [];
                updateTable([]);
                redrawGraphWithHistory();
            } else {
                showError('Server could not clear the history.');
            }
        } catch (error) {
            showError('Network error. Could not connect to the server.');
        }
    });

    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const mousePos = toMath(event.offsetX, event.offsetY);
        scale *= zoom;
        origin.x = event.offsetX - mousePos.x * scale;
        origin.y = event.offsetY + mousePos.y * scale;
        redrawGraphWithHistory();
    });

    canvas.addEventListener('mousedown', (event) => {
        isPanning = true;
        hasDragged = false;
        panStart.x = event.clientX;
        panStart.y = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isPanning) {
            const dx = event.clientX - panStart.x;
            const dy = event.clientY - panStart.y;
            if (!hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasDragged = true;
            }
            if (hasDragged) {
                origin.x += dx;
                origin.y += dy;
                panStart.x = event.clientX;
                panStart.y = event.clientY;
                redrawGraphWithHistory();
            }
        }
    });

    // *** MODIFIED mouseup LISTENER ***
    canvas.addEventListener('mouseup', (event) => {
        // This was a click attempt (not a drag).
        if (isPanning && !hasDragged) {
            hideError(); // Clear previous errors on a new click
            const selectedRRadio = form.querySelector('input[name="r"]:checked');
            if (!selectedRRadio) {
                showError('Please select an R value before clicking on the graph.');
                isPanning = false; // <<< FIX: Release the graph
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const mathCoords = toMath(pixelX, pixelY);

            let errors = [];
            if (mathCoords.x < -5 || mathCoords.x > 3) { errors.push('Clicked X is out of range [-5 ... 3].'); }
            if (mathCoords.y <= -3 || mathCoords.y >= 3) { errors.push('Clicked Y is out of range (-3 ... 3).'); }

            if (errors.length > 0) {
                showError(errors.join(' '));
                isPanning = false; // <<< FIX: Release the graph
                return;
            }

            // If validation passes, proceed to submit
            xHiddenInput.value = mathCoords.x.toFixed(15);
            yInput.value = mathCoords.y.toFixed(15);

            const params = new URLSearchParams({
                'x_hidden': xHiddenInput.value,
                'y': yInput.value,
                'r': selectedRRadio.value
            });
            submitCheck(params);
        }

        // Always reset panning state on mouseup, regardless of what happened
        isPanning = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false;
    });

    form.querySelectorAll('input[name="r"]').forEach(radio => {
        radio.addEventListener('change', redrawGraphWithHistory);
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            hideError();
            scale = 40;
            origin = { x: canvas.width / 2, y: canvas.height / 2 };
            redrawGraphWithHistory();
        }, 0);
    });

    yInput.addEventListener('input', () => {
        // Also clear the auto-hiding error if the user starts typing
        clearTimeout(errorTimeout);
        hideError();
    });

    // --- Initial Page Load ---
    redrawGraphWithHistory();
});