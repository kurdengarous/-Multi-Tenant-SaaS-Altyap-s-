# Çok Kiracılı SaaS Altyapısı

PostgreSQL **kiracı başına şema** yaklaşımıyla **kesin kiracı izolasyonu**, kiracıya bağlı JWT kimlik doğrulama ve plan tabanlı limit zorlaması gösteren, üretim seviyesi yapıdaki bir SaaS arka ucu + paneli.

> **Yığın:** NestJS · PostgreSQL · `pg` (ham SQL) · JWT · Next.js 14 (App Router) · TailwindCSS · Docker Compose.

---

## 1. Proje Adı ve Kısa Açıklama

**Proje Adı:** Çok Kiracılı SaaS Altyapısı  
**Kısa Açıklama:** Tek bir kod tabanı üzerinden bağımsız birçok müşteri kuruluşuna (kiracı / tenant) hizmet veren, veri izolasyonunu fiziksel şema ayrımıyla sağlayan, faturalandırma planları ve limit yönetimi içeren tam yığın (full-stack) SaaS altyapısı.

---

## 2. Ekran Görüntüsü / Demo GIF

> **Not:** Projeyi çalıştırdıktan sonra aşağıdaki adresleri ziyaret edebilirsiniz. Ekran görüntüleri `screenshots/` klasörüne eklenebilir.

| Sayfa | Açıklama |
|---|---|
| Çalışma Alanı Seçici | Kiracı (tenant) seçimi ve giriş ekranı |
| Panel | Kullanıcı, proje, kullanım istatistikleri ve plan limitleri |
| Projeler | Kiracı kapsamlı proje listeleme ve oluşturma |
| Kullanıcılar | Kiracıya özel üye listesi ve davet etme |
| Faturalandırma | Planlar, abonelik bilgisi ve plan değiştirme |
| Mimari | Sistem şeması, güvenlik sınırları ve `search_path` mantığı |

---

## 3. Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Arka Uç (Backend) | NestJS, TypeScript |
| Veritabanı | PostgreSQL 16 (kiracı başına şema) |
| ORM / Sürücü | `pg` (ham SQL) |
| Kimlik Doğrulama | JWT (Passport.js) |
| Önyüz (Frontend) | Next.js 14 (App Router), React, TypeScript |
| Stil | TailwindCSS |
| Konteynerleme | Docker, Docker Compose |
| Kiracı Yönetimi | AsyncLocalStorage (TenantContext) |

---

## 4. Kurulum Adımları

### 4.1 Ön Koşullar
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (veya Docker Engine + Compose v2)
- Git

### 4.2 Depoyu Klonla

```bash
git clone https://github.com/kurdengarous/-Multi-Tenant-SaaS-Altyap-s-.git
cd -Multi-Tenant-SaaS-Altyap-s-
```

### 4.3 Ortam Değişkenleri (Opsiyonel)

Proje varsayılan değerlerle çalışır. İsterseniz `backend/.env.example` dosyasını `.env` olarak kopyalayabilirsiniz:

```bash
cp backend/.env.example backend/.env
```

> **Önemli:** Gizli dosyalar (`.env`, `node_modules/`, `dist/`, `pgdata/`) asla repoya pushlanmaz. `.gitignore` dosyası bu dosyaları korur.

---

## 5. Nasıl Çalıştırılır

Tüm servisleri (PostgreSQL, NestJS arka uç, Next.js önyüz) tek komutla başlatın:

```bash
docker compose up --build
```

İlk açılışta arka uç otomatik olarak şunları yapar:

1. `public.*` tablolarını oluşturur.
2. `acme`, `xyz`, `nova` kiracı şemalarını ve tablolarını oluşturur.
3. Abonelikleri, kullanıcıları ve örnek projeleri ekler.

### Erişim Noktaları

| Servis | URL |
|---|---|
| Önyüz (Panel) | http://localhost:9000 |
| Arka Uç (API) | http://localhost:9001/api |
| Sağlık Kontrolü | http://localhost:9001/api/health |
| PostgreSQL | `localhost:5434` → container içi `5432` (kullanıcı: `saas`, parola: `saas`) |

### Varsayılan Giriş Bilgileri

Her kiracı için varsayılan parola: **`password123`**

| Kiracı | Yönetici | Üye |
|---|---|---|
| acme | `admin@acme.app.local` | `member@acme.app.local` |
| xyz  | `admin@xyz.app.local`  | `member@xyz.app.local`  |
| nova | `admin@nova.app.local` | `member@nova.app.local` |

### Güvenlik Sınırını Elle Deneyin

```bash
# Acme'ye giriş yap
TOKEN=$(curl -s http://localhost:9001/api/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant: acme" \
  -d '{"email":"admin@acme.app.local","password":"password123"}' \
  | jq -r .accessToken)

# Aynı token, farklı kiracı başlığı → 403 Forbidden
curl -i http://localhost:9001/api/projects \
  -H "Authorization: Bearer $TOKEN" -H "X-Tenant: xyz"
```

---

## 6. Proje Yapısı Açıklaması

### 6.1 GitHub Repo Yapısı

```
-Multi-Tenant-SaaS-Altyap-s-/
  README.md               <-- ÖNEMLİ (kurulum, kullanım, ekran görüntüleri)
  LICENSE                 <-- MIT
  .gitignore              <-- Gizli dosyaları korur
  docker-compose.yml      <-- Tüm servisleri orkestrasyonu
  backend/
    package.json          <-- NestJS bağımlılıkları
    tsconfig.json
    nest-cli.json
    Dockerfile
    .env.example          <-- Ortam değişkeni örneği
    src/
      main.ts             <-- Uygulamayı başlatır, migration + seed çalıştırır
      app.module.ts       <-- Modülleri ve global tenant middleware'i bağlar
      common/             <-- TenantContext (AsyncLocalStorage)
      middleware/         <-- TenantMiddleware
      database/           <-- pg Pool, migration, seed
      auth/               <-- JWT giriş, strategy, guard, çapraz kiracı kontrolü
      tenants/            <-- Çalışma alanı listesi, panel, mevcut kiracı bilgisi
      users/              <-- Kiracı başına üyelik yönetimi
      billing/            <-- Planlar, abonelik, limit zorlaması
      projects/           <-- Kiracı kapsamlı CRUD (kiracı başına şema)
  frontend/
    package.json          <-- Next.js bağımlılıkları
    tsconfig.json
    next.config.js
    tailwind.config.js
    postcss.config.js
    Dockerfile
    app/                  <-- Sayfa bileşenleri
      page.tsx            <-- Çalışma alanı seçicisi
      login/              <-- Kiracıya bağlı giriş
      dashboard/          <-- Canlı sayımlar ve plan limitleri
      projects/           <-- Proje yönetimi
      users/              <-- Kullanıcı yönetimi
      billing/            <-- Faturalandırma sayfası
      settings/           <-- Kiracı ayarları ve izolasyon bilgisi
      architecture/       <-- Mimari açıklama sayfası
    components/
      Shell.tsx           <-- Sol menü + izolasyon bandı
    lib/
      api.ts              <-- Her isteğe X-Tenant + Bearer ekler
  screenshots/            <-- Demo ekran görüntüleri (opsiyonel)
```

### 6.2 Yapı Taşları

| Bileşen | Görev |
|---|---|
| `TenantMiddleware` | Her istekte kiracıyı `X-Tenant` başlığı veya alt-alandan çözümler |
| `TenantContext` | `AsyncLocalStorage` ile istek boyunca kiracı bilgisini taşır |
| `DatabaseService` | `SET search_path` ile bağlantı başına şema yönlendirmesi yapar |
| `JwtAuthGuard` | JWT imzasını ve kiracı bağlılığını doğrular |
| `BillingService` | Plan limitlerini insert işleminden önce zorunlu kılar |

---

## 7. Öne Çıkan Özellikler

- **Kesin Kiracı İzolasyonu:** PostgreSQL `search_path` ile fiziksel şema ayrımı. Kiracı A, Kiracı B'nin verisine niteleyicisiz sorguyla bile erişemez.
- **JWT + Çapraz Kiracı Koruması:** Her token bir kiracıya bağlıdır. Başka kiracı başlığıyla kullanılırsa `403 Forbidden` döner.
- **Plan Tabanlı Limit Zorlaması:** Kullanıcı ekleme, proje olume işlemlerinden önce kotayı aşan satır oluşmaz.
- **AsyncLocalStorage ile Kiracı Bağlamı:** Eş zamanlı istekler birbirine karışmaz, çağrı yığınının derinliklerinde bile doğru kiracı bilinir.
- **Yedeklenebilirlik:** Kiracı başına şema, B2B "verimi ver / sil" anlaşmaları için şema düzeyinde yedekleme imkanı sunar.
- **Ekonomik Ölçeklenme:** Yeni kiracı eklemek yeni konteyner veya veritabanı demek değil, sadece `CREATE SCHEMA` + `INSERT`.

---

## 8. Karşılaşılan Zorluklar ve Çözümler

| Zorluk | Çözüm |
|---|---|
| Çoklu kiracıda veri sızıntı riski | `SET search_path` ile fiziksel şema izolasyonu; `tenant_id` satır düzeyi izolasyonu `audit_log` tablosunda alternatif olarak gösterildi. |
| Eş zamanlı isteklerde kiracı karışması | `AsyncLocalStorage` (Node.js) ile her istek kendi bağlamında çalıştırıldı. |
| Çapraz kiracı token yeniden oynatma saldırısı | JWT içindeki `tenantId` ile istek başlığı karşılaştırıldı (`assertTokenMatchesTenant`), uyuşmazsa `403`. |
| Plan limitlerinin geçilmesi | `BillingService.assertCanAdd*()` metotları ile her ekleme işleminden önce kota kontrolü yapıldı. |
| Prisma'nın çoklu şema dinamikliği | Ham `pg` sürücüsü kullanıldı; `search_path` çalışma zamanında değiştirilebilir. |
| Port çakışması (5432 zaten kullanımda) | `docker-compose.yml`'de PostgreSQL host portu `5434:5432` olarak ayarlandı. |

---

## 9. Kaynaklar

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL SET search_path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Docker Compose Overview](https://docs.docker.com/compose/)
- [Passport.js JWT Strategy](https://www.passportjs.org/packages/passport-jwt/)

---

## 10. Lisans

MIT License © Akademik Proje

> **Uyarı:** Varsayılan JWT secret'ı ve seed parolaları **üretim için güvenli değildir**. Üretim ortamına taşımadan önce `JWT_SECRET` ve veritabanı kimlik bilgilerini değiştirin.
