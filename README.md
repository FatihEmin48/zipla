# 🏃 Zıpla!

Tarayıcıda oynanan bir **2D platform** oyunu. Koş, zıpla, coin'leri topla ve bayrağa ulaş! Saf HTML5 Canvas + CSS + vanilla JavaScript — framework yok, build adımı yok. `index.html`'i çift tıklayarak da çalışır.

**Canlı oyna:** https://fatihemin48.github.io/zipla/

**Uygulama olarak kur (PWA):** Tarayıcı menüsünden "Ana ekrana ekle" / "Uygulamayı yükle" ile ikonlu, tam ekran, **çevrimdışı** açılan bir uygulama olarak kurulur (telefonda yatay).

## Nasıl oynanır

- **Klavye:** `←` `→` (ya da `A` `D`) hareket · `Boşluk` / `↑` / `W` zıpla — havadayken bir kez daha basarsan **çift zıplama** · `R` bölümü yeniden başlat.
- **Dokunmatik:** alttaki ◀ ▶ ve **ZIPLA** butonları.
- Her bölümde **coin'leri topla** ve 🚩 **bitiş bayrağına** ulaş. Boşluğa düşersen ya da **dikenlere** ⚠️ değersen başa dönersin (ölüm sayısı üstte gösterilir).
- **Düşmanlar** 👹 devriye gezer (yürüyen + havada süzülen **uçan** tür): **üstüne zıplarsan** onları yener ve sekersin; **yandan** değersen ölürsün.
- **Hareketli platformlar** üstünde durursan seninle taşınır.
- **Checkpoint** 🚩 çizgisini geçersen, sonra ölürsen başa değil oraya dönersin (uzun bölümlerde işine yarar).
- **Duvara tutunma & duvar zıplaması:** Havada bir duvara yaslanıp o yöne basılı tutarsan yavaşça kayarsın (tutunma); yaslıyken zıplarsan duvardan uzağa itilerek zıplarsın (wall jump).
- Bölümü bitirince **1-3 ⭐ yıldız** kazanırsın: bitirme (1) + tüm coin'leri toplama (1) + hedef sürenin altında kalma (1). En iyi süren, coin'in ve yıldızın kaydedilir; **sonraki bölüm** açılır. Üstteki numaralardan açık bölümlere geçebilir, yıldızlarını görebilirsin.
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

Daha fazla bölüm, arka plan müziği, hareketli tehlikeler, güç-yükseltmeleri.
