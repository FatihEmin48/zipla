# 🏃 Zıpla!

Tarayıcıda oynanan bir **2D platform** oyunu. Koş, zıpla, coin'leri topla ve bayrağa ulaş! Saf HTML5 Canvas + CSS + vanilla JavaScript — framework yok, build adımı yok. `index.html`'i çift tıklayarak da çalışır.

**Canlı oyna:** https://fatihemin48.github.io/zipla/

## Nasıl oynanır

- **Klavye:** `←` `→` (ya da `A` `D`) hareket · `Boşluk` / `↑` / `W` zıpla · `R` bölümü yeniden başlat.
- **Dokunmatik:** alttaki ◀ ▶ ve **ZIPLA** butonları.
- Her bölümde **coin'leri topla** ve 🚩 **bitiş bayrağına** ulaş. Boşluğa düşersen ya da **dikenlere** ⚠️ değersen başa dönersin (ölüm sayısı üstte gösterilir).
- Bölümü bitirince süren ve topladığın coin kaydedilir; **sonraki bölüm** açılır. Üstteki numaralardan açık bölümlere geçebilirsin.
- İlerleme otomatik kaydedilir (localStorage).

## Mimari

Saf oyun mantığı (`js/game.js`) DOM/canvas'tan bağımsızdır, bu yüzden Node ile test edilebilir:

| Dosya | Amaç |
|---|---|
| `js/config.js` | Sabitler (fizik, boyutlar) + bölüm verileri (`LEVELS`) |
| `js/game.js` | Saf mantık: fizik adımı, AABB çarpışma, coin/hedef/ölüm, ilerleme kaydı |
| `js/input.js` | Klavye + dokunmatik girdi (zıplama kenar-tetikli) |
| `js/render.js` | Canvas çizimi (kamera, parallax gökyüzü, platform/coin/bayrak/karakter) |
| `js/main.js` | Oyun döngüsü, bölüm geçişi, HUD, kazanma ekranı |

## Doğrulama

`node --check` tüm `js/*.js` dosyalarında; ayrıca `js/game.js` fiziği (yerçekimi, zıplama, çarpışma çözümü, coin toplama, hedef/ölüm, ilerleme) Node'da headless test edilir.

## Sonraki sürümler (kapsam dışı)

Daha fazla bölüm, düşmanlar (üstüne zıplama), hareketli platformlar, çift zıplama, checkpoint, süre/yıldız derecesi, ses, PWA.
