# Eskişehir Masası

Proje adresi: https://eskisehir-masasi.ozgurarc.chatgpt.site (özel erişim).

Bu proje sunucuda çalışan Vinext/Cloudflare Worker uygulaması ve D1 veritabanı kullanır. GitHub kaynak kod deposudur; GitHub Pages bu sunucu ve veritabanı işlevlerini çalıştırmaz.

Yerel haber sitesi. İlk içerik seçkisi 30 Eylül 2026 tarihinde doğrulanan resmi kamu kurumu sayfalarından derlenmiştir. 34 haber, 14 ilçe, 15 ana kategori, fotoğraf galerileri ve 5 resmi video bulunur. Eski kaynaklar tarihleri korunarak arşiv olarak belirtilir.

## İçerik

- `data/articles.json`: Haberler, özgün kaynak URL'leri, tarihler, kategori/ilçe eşleşmeleri.
- `data/videos.json`: Doğrulanan belediye video arşivleri.
- `public/news`: Optimizasyonu yapılmış gerçek kurum fotoğrafları.
- Otomatik haber toplama ya da düzenli yenileme henüz etkinleştirilmedi. Haberler editoryal olarak güncellenir.

## YouTube canlı yayın

Sites ortam değerlerinde `YOUTUBE_LIVE_VIDEO_ID` geçerli 11 karakterlik yayın video kimliği veya `YOUTUBE_CHANNEL_ID` kanal kimliği olarak girildiğinde `/canli-yayin` oynatıcıyı gösterir. Kanal henüz paylaşılmadığından mevcut durum yayın bekleniyor olarak gösterilir; sahte canlı yayın bulunmaz. YouTube kanalında gömmeye izin verilmesi gerekir. Site YouTube üzerinden yayın başlatmaz.

## Veri ve formlar

D1 `DB` bağlaması ve Drizzle şemaları kullanılır. Tepkiler ziyaretçi/haber bazında benzersizdir; yorumlar ve iletişim talepleri kalıcı olarak kaydedilir. İletişim talepleri `messages` tablosundadır. Yorumlar doğrudan yayımlanır. CSRF için aynı kaynak kontrolü, uzunluk kontrolleri ve çerez tabanlı hız sınırı vardır. Ayrı bir editör yönetim paneli yoktur.

Künye ve yayıncı iletişim bilgileri yayımlamadan önce tamamlanmalıdır. İlk yayın erişimi özel olarak korunur.

## Geliştirme

Kurulum ve yayın için proje Sites akışını kullanır. Veritabanı şeması `db/schema.ts`, artımlı şema dosyaları `drizzle/` içindedir. Kod kontrolü `node node_modules/typescript/bin/tsc --noEmit` ile yapılabilir.
