# Avla Watcher — Kurulum Rehberi

Toplam süre: ~5 dakika. İhtiyaç: bir Google hesabı (`sami@avla.com.tr` ile giriş yaptığınız).

Ajan ne yapar:
- `www.avlarealestate.com` her 5 dakikada kontrol edilir.
- Site düşerse → e-posta alert.
- Sayfanın görünür içeriği (metin) değişirse → e-posta alert.
- Pazartesi sabahları → haftalık özet e-postası.
- VENUS landing yayına alındığında onu da listeye ekleyebilirsiniz.

---

## 1. Apps Script projesi oluştur

1. Tarayıcınızda `https://script.google.com` adresini açın.
2. Üstteki **+ New project** (yeni proje) butonuna basın.
3. Sol üstteki "Untitled project" yazısına tıklayıp ismi **Avla Watcher** olarak değiştirin.

## 2. Kodu yapıştır

1. Sol panelde **Code.gs** dosyası açıktır. İçindeki örnek `function myFunction() {}` kodunu **tamamen silin**.
2. Bu klasördeki [Code.gs](Code.gs) dosyasının TÜM içeriğini kopyalayın → Apps Script'teki boş alana yapıştırın.
3. Üstteki disket ikonu (💾) veya `Cmd+S` ile kaydedin.

## 3. Saat dilimini ayarla (Pazartesi raporu doğru saatte gelsin)

1. Sol alt köşede ⚙️ **Project Settings** (proje ayarları) tıklayın.
2. **Time zone** alanını `(GMT+03:00) Istanbul` seçin.
3. **Save**.
4. Sol üstte **Editor** ikonuna tıklayıp koda geri dönün.

## 4. E-posta iznini ver

1. Üstte fonksiyon listesi (dropdown) → **testEmail** seçin.
2. **Run** (▶️ Çalıştır) tıklayın.
3. Google izin penceresi açılır:
   - **Sign in with Google** → Avla Gmail hesabınızı seçin.
   - "Google hasn't verified this app" uyarısı çıkar → **Advanced** → **Go to Avla Watcher (unsafe)** linkine tıklayın. (Kendi yazdığımız script olduğu için güvenli; Google sadece doğrulanmamış 3. parti uygulamaları kontrol eder.)
   - **Allow** / **İzin ver**.
4. Birkaç saniye sonra Apps Script alttaki "Execution log" satırında ✓ görmelisiniz.
5. **sami@avla.com.tr** kutunuza `[Avla Watcher] Test maili` başlıklı mail düşmüş olmalı.

> Test maili gelmediyse devam etmeyin — bana yazın, beraber bakarız.

## 5. Trigger'ları kur (otomatik çalışmaya başlasın)

1. Fonksiyon dropdown → **setupTriggers** seçin.
2. **Run** (▶️) tıklayın.
3. Birkaç saniye sonra **sami@avla.com.tr**'ye `[Avla Watcher] Kurulum tamamlandı` maili düşer.

**Tamamlandı.** Bundan sonra:
- Site içeriği değişirse → mail.
- Site düşerse → mail.
- Her Pazartesi 09:00 → haftalık özet.

---

## Sonradan ne yapacağınız

| Yapmak istediğiniz | Adım |
|---|---|
| Geçici durdur | Apps Script → fonksiyon dropdown → **stopAllTriggers** → Run |
| Yeniden başlat | **setupTriggers** → Run |
| Yeni URL ekle | `Code.gs` → `CONFIG.TARGETS` bloğunda yorum (`//`) işaretlerini kaldırıp URL'i yazın → kaydet → **setupTriggers** tekrar Run |
| Alert adresini değiştir | `Code.gs` → `ALERT_EMAIL` değerini değiştir → kaydet (yeni alert atılana kadar trigger'a dokunmaya gerek yok) |

---

## Bu ajanın YAPAMADIKLARI (önemli — yanlış güven oluşmasın)

Ajan dışarıdan bir gözcü. Wix admin paneline kim giriyor göremez. Bu yüzden manuel olarak yapmanız gerekenler:

1. **Wix → Settings → Login Activity** — haftada bir göz atın. Tanımadığınız bir IP/lokasyondan oturum varsa şifreyi değiştirin.
2. **Wix → Roles & Permissions** — sadece güvendiğiniz kişiler yetkili olsun. Eski çalışanları temizleyin.
3. **Gmail + Wix hesabınızda 2FA (iki adımlı doğrulama) açın** — en kritik adım. Şifreniz çalınsa bile telefon kodu olmadan giremezler.
4. Şifrenizi 90 günde bir değiştirin, başka yerde kullanmadığınız bir parola olsun.

Haftalık özet maili size bunları her Pazartesi hatırlatacak.

---

## Maliyet

**0 TL.** Apps Script ücretsiz tier yeterli:
- E-posta: 100/gün hakkı (biz günde maksimum 5–10 kullanırız)
- Fetch: 20.000/gün hakkı (biz günde ~288 kullanırız)
- Trigger: sınırsız

## Sorun çıkarsa

- Apps Script → sol menü → **Executions** (saat ikonu): son 7 günde her çalışmanın durumu görünür.
- Bir hata varsa kırmızı satır olur; tıklayınca detay açılır.
- Bana ekran görüntüsü atın, beraber çözeriz.
