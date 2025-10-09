"use strict";

document.addEventListener('DOMContentLoaded', () => {

    let currentSessionId = sessionStorage.getItem('sessionId');
    let lastClickedPoint = null;

    // Element seçicilerini yeni HTML ID'lerine göre güncelliyoruz
    const form = document.getElementById('coordinates-form');
    const xSelect = document.getElementById('x-select');
    const yInput = document.getElementById('y-text'); // ID değiştirildi
    const rRadios = document.querySelectorAll('input[name="r"]');
    const resultsTableBody = document.getElementById('results-body'); // ID değiştirildi
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    const errorContainer = document.getElementById('error-container');
    const clearHistoryButton = document.getElementById('clear-history-button');

    function showError(message) {
        errorContainer.innerHTML = message;
        errorContainer.classList.add('visible');
    }

    function hideError() {
        errorContainer.classList.remove('visible');
        errorContainer.style.display = 'none'; // Stili de güncelliyoruz
    }

    function showAndAutoHideError(message) {
        errorContainer.innerHTML = message;
        errorContainer.classList.add('visible');
        errorContainer.style.display = 'block';
        setTimeout(() => {
            hideError();
        }, 3000);
    }

    function filterInput(event) {
        // Bu fonksiyon olduğu gibi kalabilir, mantığı doğru.
        const key = event.key;
        const input = event.target;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) { return; }
        if (key === '-' && input.selectionStart === 0 && !input.value.includes('-')) { return; }
        const isDecimalSeparator = key === '.' || key === ',';
        const hasDecimalSeparator = input.value.includes('.') || input.value.includes(',');
        if (isDecimalSeparator && hasDecimalSeparator) { event.preventDefault(); return; }
        if (/[0-9]/.test(key) || isDecimalSeparator) { return; }
        event.preventDefault();
    }
    yInput.addEventListener('keydown', filterInput);
    form.addEventListener('input', () => {
        errorContainer.classList.remove('visible');
        errorContainer.style.display = 'none';
    });


    canvas.addEventListener('click', (event) => {
        hideError();
        const rRadio = document.querySelector('input[name="r"]:checked');
        if (!rRadio) {
            showAndAutoHideError("Please select an R value before clicking on the graph.");
            return;
        }
        const rValue = parseFloat(rRadio.value);

        const rect = canvas.getBoundingClientRect();
        const x_pixel = event.clientX - rect.left;
        const y_pixel = event.clientY - rect.top;

        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const r_pixels = 120;

        const x_math = (x_pixel - cx) / r_pixels * rValue;
        const y_math = (cy - y_pixel) / r_pixels * rValue;

        yInput.value = y_math.toFixed(3).substring(0, 15);

        let closestXOption = null;
        let minDistance = Infinity;
        Array.from(xSelect.options).forEach(option => {
            const optionValue = parseFloat(option.value);
            const distance = Math.abs(x_math - optionValue);
            if (distance < minDistance) {
                minDistance = distance;
                closestXOption = option;
            }
        });
        if (closestXOption) {
            closestXOption.selected = true;
        }

        lastClickedPoint = { x: x_pixel, y: y_pixel, hit: isHit(x_math, y_math, rValue) };
        drawGraph();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        lastClickedPoint = null;
        drawGraph();

        let errors = [];

        const yValueStr = yInput.value.trim();
        let yValue;
        if (yValueStr === "") {
            errors.push("Input a value for Y");
        } else {
            const yNormalized = yValueStr.replace(',', '.');
            if (!/^-?\d+(\.\d{1,15})?$/.test(yNormalized)) {
                errors.push("Y value is invalid or has too many decimal places.");
            } else {
                yValue = parseFloat(yNormalized);
                if (isNaN(yValue)) {
                    errors.push("Y value is not a valid number");
                } else if (yValue < -5 || yValue > 5) {
                    errors.push("Y value is out of range (-5 to 5)");
                }
            }
        }

        const rRadio = document.querySelector('input[name="r"]:checked');
        if (!rRadio) {
            errors.push("Select an R value");
        }
        if (errors.length > 0) {
            showAndAutoHideError(errors.join('<br>'));
            return;
        }

        const params = new URLSearchParams({
            x: xSelect.value,
            y: yInput.value.trim().replace(',', '.'),
            r: rRadio.value
        });
        if (currentSessionId) { params.append('sessionId', currentSessionId); }

        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            const data = await response.json();

            if (response.ok) {
                if (data.sessionId && !currentSessionId) {
                    currentSessionId = data.sessionId;
                    sessionStorage.setItem('sessionId', currentSessionId);
                }
                updateTableFromServerHistory(data.history);
            } else {
                showAndAutoHideError(`Server Error: ${data.reason || 'Unknown error'}`);
            }
        } catch (err) {
            showAndAutoHideError(`Network Error. Server may be down.`);
        }
    });

    form.addEventListener('reset', () => {
        hideError();
        lastClickedPoint = null;
        drawGraph();
    });

    clearHistoryButton.addEventListener('click', async () => {
        lastClickedPoint = null;
        drawGraph();
        if (!currentSessionId) {
            resultsTableBody.innerHTML = '';
            return;
        }
        hideError();
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=clear&sessionId=${currentSessionId}`
            });
            const data = await response.json();
            if (response.ok) {
                updateTableFromServerHistory(data.history);
            } else {
                showAndAutoHideError(`Server Error: ${data.reason || 'Could not clear history'}`);
            }
        } catch (err) {
            showAndAutoHideError("Network Error: Could not connect to the server.");
        }
    });

    function updateTableFromServerHistory(historyArray) {
        resultsTableBody.innerHTML = '';
        if (!historyArray) return;
        historyArray.slice().reverse().forEach(result => {
            const newRow = `<tr>
                <td>${result.x.toFixed(2)}</td>
                <td>${result.y.toFixed(2)}</td>
                <td>${result.r.toFixed(2)}</td>
                <td style="color: ${result.hit ? 'green' : 'red'}">${result.hit ? "Hit" : "Miss"}</td>
                <td>${new Date(result.serverTime).toLocaleTimeString()}</td>
                <td>${result.execTime}</td>
            </tr>`;
            resultsTableBody.innerHTML += newRow;
        });
    }

    async function loadInitialHistory() {
        if (!currentSessionId) { return; }
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=get_history&sessionId=${currentSessionId}`
            });
            const data = await response.json();
            if (response.ok) {
                updateTableFromServerHistory(data.history);
            }
        } catch (err) {
            console.error("Failed to load initial history:", err);
        }
    }

    function drawGraph() {
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const r_pixels = 120;
        ctx.clearRect(0, 0, w, h);

        // Çizim rengi
        ctx.fillStyle = 'rgba(70, 130, 180, 0.7)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;


        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r_pixels / 2, cy);
        ctx.lineTo(cx, cy - r_pixels);
        ctx.closePath();
        ctx.fill();


        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r_pixels, Math.PI / 2, Math.PI, false);
        ctx.closePath();
        ctx.fill();


        ctx.fillRect(cx, cy, r_pixels, r_pixels);


        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';

        ctx.beginPath();
        ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy);
        ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10);
        ctx.stroke();

        // Etiketler
        ctx.fillText('R', cx + r_pixels - 10, cy + 15);
        ctx.fillText('R/2', cx + r_pixels / 2 - 10, cy + 15);
        ctx.fillText('-R/2', cx - r_pixels / 2 - 15, cy + 15);
        ctx.fillText('-R', cx - r_pixels - 15, cy + 15);

        ctx.fillText('R', cx + 5, cy - r_pixels + 5);
        ctx.fillText('R/2', cx + 5, cy - r_pixels / 2 + 5);
        ctx.fillText('-R/2', cx + 5, cy + r_pixels / 2 + 5);
        ctx.fillText('-R', cx + 5, cy + r_pixels + 5);

        if (lastClickedPoint) {
            ctx.beginPath();
            ctx.arc(lastClickedPoint.x, lastClickedPoint.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = lastClickedPoint.hit ? 'green' : 'red';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
    }

    function isHit(x, y, r) {
        if (x >= 0 && y >= 0) return y <= (-2 * x + r);
        if (x < 0 && y > 0) return false;
        if (x < 0 && y <= 0) return (x * x + y * y) <= (r * r);
        if (x >= 0 && y < 0) return (x <= r) && (y >= -r);
        return false;
    }

    drawGraph();
    loadInitialHistory();
});