// Bu fonksiyon, tüm sayfa yüklendiğinde otomatik olarak çalışır.
// Bu, JS kodumuzun henüz var olmayan HTML elemanlarına erişmeye çalışmasını engeller.
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('coordinates-form');
    const yInput = document.getElementById('y-text');
    const resultsBody = document.getElementById('results-body');

    // Forma "submit" (gönderme) olayı ekliyoruz.
    form.addEventListener('submit', (event) => {
        // sayfayı yeniden yükleme engelliyoruz.
        event.preventDefault();

        // 1. İSTEMCİ TARAFLI DOĞRULAMA
        if (!validateY()) {
            // Eğer Y değeri geçersizse, hiçbir şey yapma.
            return;
        }

        // 2. VERİLERİ TOPLAMA
        const formData = new FormData(form);
        const x = formData.get('x');
        const y = yInput.value.trim();
        const r = formData.get('r');

        // 3. AJAX İLE SUNUCUYA GÖNDERME
        // Yerel test için /calculate yeterli.
        const url = '/calculate';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },

            body: new URLSearchParams({ x, y, r })
        })
            .then(response => {
                // Sunucudan gelen cevabın JSON olup olmadığını kontrol et
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Cevabı JSON olarak işle
            })
            .then(data => {
                // 4. SONUÇ TABLOSUNU GÜNCELLEME
                // Geçmişi temizle ve sunucudan gelen yeni geçmişi ekle
                resultsBody.innerHTML = ''; // Tabloyu temizle
                data.history.forEach(result => {
                    const newRow = `<tr>
                                    <td>${result.x}</td>
                                    <td>${result.y}</td>
                                    <td>${result.r}</td>
                                    <td>${result.hit ? 'Hit' : 'Miss'}</td>
                                    <td>${result.attemptTime}</td>
                                    <td>${result.processingTime.toFixed(3)} µs</td>
                                </tr>`;
                    resultsBody.innerHTML += newRow; // Yeni satır ekleme
                });
            })
            .catch(error => {
                // Bir hata olursa konsola yazdır.
                console.error('There was a problem with your fetch operation:', error);
                alert('An error occurred while communicating with the server.');
            });
    });

    // Y değeri doğrulama fonksiyonu
    function validateY() {
        const yValue = yInput.value.trim(); // Boşlukları temizle
        const yNumber = parseFloat(yValue.replace(',', '.')); // Virgülü noktaya çevir

        // Boş olup olmadığını kontrol et
        if (yValue === '') {
            alert('Y value cannot be empty.');
            return false;
        }

        // Sayı olup olmadığını kontrol et
        if (isNaN(yNumber)) {
            alert('Y must be a valid number.');
            return false;
        }

        // -5 ile 5 aralığında olup olmadığını kontrol et
        if (yNumber < -5 || yNumber > 5) {
            alert('Y must be between -5 and 5.');
            return false;
        }

        return true; // Her şey yolundaysa true döndür
    }
});