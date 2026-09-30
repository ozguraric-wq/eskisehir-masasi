# Eskişehir Masası

GitHub Pages adresi: https://ozguraric-wq.github.io/eskisehir-masasi/

Tam sunucu sürümü: https://eskisehir-masasi.ozgurarc.chatgpt.site (özel erişim).

Ana uygulama Vinext/Cloudflare Worker ve D1 veritabanı kullanır. Aynı tasarım ve içerikten GitHub Pages için ayrı bir statik yayın üretilir.

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

## GitHub Pages yayını

- Kaynak kod: `main`; yayımlanmış statik dosyalar: `gh-pages`.
- GitHub Settings → Pages → Deploy from a branch → `gh-pages` → `/(root)`.
- Yeniden üretmek için Node 22.13+ ve depoda sabitlenen pnpm sürümüyle `pnpm install --frozen-lockfile`, ardından `pnpm build:pages` çalıştırın.
- Çıktı `out/github-pages/` klasörüdür. Bu klasörün tüm içeriğini, `.nojekyll` dahil, `gh-pages` dalının köküne yayımlayın.
- Haber, kategori, ilçe, arama, sayfalama, fotoğraf galerisi, video, paylaşım, RSS ve site haritası GitHub adresinde çalışır.
- Yorum, tepki ve iletişim kaydı D1 gerektirir; GitHub sürümünde bu gönderim formları gösterilmez. Tam sunucu uygulamasının API ve form kodları korunmuştur.
- GitHub yayınındaki YouTube kanal/yayın kimlikleri `data/live.json` dosyasından alınır. Kimlikleri güncelledikten sonra statik yayını yeniden üretin.
- `main` içeriğini değiştirmek tek başına statik yayını yenilemez; yukarıdaki üretim/yayımlama adımı gerekir.

`build:pages`, `.github-pages-build/` içinde ayrı bir Next.js statik export hazırladığı için asıl uygulamanın sunucu dosyalarını değiştirmez.

## Yayın yönetimi (30 Eylül 2026)

Kamuya açık site: https://ozguraric-wq.github.io/eskisehir-masasi/
Yönetim: https://eskisehir-masasi.ozgurarc.chatgpt.site/yonetim

Yönetim uygulaması sahibiyle sınırlı özel Site üzerinde çalışır. D1 haber taslaklarını,
ayarları, sürüm geçmişini ve değiştirilemeyen yayın paketlerini; R2 yüklenen görselleri saklar.
Üretimde `CMS_ADMIN_EMAIL` doğrulanmış yayın sahibine ayarlanır. Platform erişim politikası
özel kalmalıdır. Yönetim API'leri oturum kimliğini ve yazma isteklerinde aynı origin'i denetler.

İş akışı: Haberi düzenle → Taslak / Yayına hazır durumunu seç → Değişiklikleri kaydet →
Yayın kuyruğuna al. Yalnızca yayıma hazır içerik dışa aktarılır. Paneldeki sürüm geri yükleme
çalışma alanına uygulanır; kamuya açık siteyi değiştirmek için yeniden yayın gerekir.

`.github/workflows/publish.yml` ana dala gönderimde veya manuel çalıştırmada siteyi oluşturur.
Beş dakikalık zamanlayıcı yeni yayın paketi olup olmadığını denetler; GitHub yoğunluğunda
gecikebilir. İşlem başarıyla bittikten sonra panelde durum “Yayında” olur.
GitHub Pages yayın kaynağı **GitHub Actions** olmalıdır. İlk sürümden kalan `gh-pages`
dalı geçmiş yedeğidir; yeni yayımları Actions artifact üzerinden sağlar.

**Gerekli tek bağlantı ayarı:** Bu depoda `CMS_SERVICE_TOKEN` adlı GitHub Actions secret,
özel Site'nin platform servis erişim anahtarına ayarlanmalıdır. Anahtarı kaynak koduna,
tarayıcı koduna veya günlük çıktısına koymayın. Bu ayar olmadan ana dalın mevcut içerikleri
yayımlanır; yönetim panelinin kuyruğu aktarılmaz. `/api/publisher/` servis erişimi, platformun
özel Site sınırına dayanır; uygulama herkese açık hale getirilmemelidir.

`node scripts/build-github-pages.mjs` yalnızca kamuya açık HTML/JS ve görselleri dışa aktarır.
Yönetim API'leri ve veritabanı hiçbir zaman GitHub Pages çıktısına dahil edilmez.
Başka oturumdaki değişikliğin üzerine yazmayı engelleyen sürüm denetimi, görsel tür/boyut
kontrolü, taslak ayırımı ve R2 erişimi derlenmiş Worker üzerinde test edilmiştir.

Piyasa bandı Frankfurter/ECB günlük döviz referanslarını, Gold API ons fiyatını ve Kraken
kripto göstergelerini tarayıcıdan alır. Kaynak ve zaman, ayrıntı sayfasında gösterilir;
veri alınamadığında fiyat uydurulmaz. Gram altın gösterge değeri hesaplanır; kuyumcu
alış/satış fiyatı değildir. Video ve YouTube kimlikleri panelden düzenlenebilir.
