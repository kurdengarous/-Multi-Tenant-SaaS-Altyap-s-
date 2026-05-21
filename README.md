# Haber Ajansı Çok Kiracılı Taslak Yönetim Sistemi

> Birden fazla haber ajansının tek bir platform üzerinden **tamamen izole** çalışmasını sağlayan,
> muhabirlerin haberlerini **yayına girmeden önce taslak** olarak paylaşmasına ve ajans genelinde
> incelenmesine olanak tanıyan tam yığın (full-stack) çok kiracılı SaaS uygulaması.

**Teknoloji Yığını:** NestJS · PostgreSQL 16 · `pg` (ham SQL) · JWT · Next.js 14 (App Router) · TailwindCSS · Docker Compose

---

## 1. Proje Adı ve Kısa Açıklama

**Proje Adı:** Haber Ajansı Çok Kiracılı Taslak Yönetim Sistemi

**Kısa Açıklama:**

Bu proje, `TatvanTV`, `Ahlat TV` ve `Norşin TV` gibi birbirinden bağımsız haber ajanslarının **aynı yazılım altyapısı** üzerinde, **birbirlerinin verilerini göremeyecekleri** şekilde çalışmasını sağlayan çok kiracılı (multi-tenant) bir SaaS platformudur.

**Temel iş senaryosu:** Bir haber ajansındaki muhabirler, haberlerini yayına göndermeden önce sisteme **taslak** olarak kaydeder. Aynı ajansa ait diğer muhabirler ve ajans yöneticisi (patron) bu taslakları görebilir, böylece kolektif bir ön inceleme süreci işler. Taslaklar farklı ajanslardan kesinlikle görünmez; `TatvanTV` muhabiri hiçbir zaman `Ahlat TV`'nin taslağına erişemez.

Sistem; PostgreSQL'in **şema-başına-kiracı** (schema-per-tenant) izolasyon modelini, `AsyncLocalStorage` tabanlı kiracı bağlamını, JWT kimlik doğrulamasını ve abonelik planlarına dayalı kullanım limitlerini üretim kalitesinde hayata geçirmektedir.

---

## 2. Ekran Görüntüsü / Demo GIF

Ekran görüntüleri `screenshots/` klasörüne eklenmiştir. Uygulamayı çalıştırdıktan sonra **http://localhost:9000** adresinden aşağıdaki ekranları gezebilirsiniz:

| Ekran | URL | Açıklama |
|---|---|---|
| **Ajans Seçimi** | `/` | Sistemdeki haber ajanslarını listeler; kullanıcı giriş yapmak istediği ajansı seçer |
| **Giriş** | `/login` | Seçilen ajansa özel kullanıcı adı / şifre ile kimlik doğrulama |
| **Panel (Dashboard)** | `/dashboard` | Ajansa ait taslak sayısı, muhabir sayısı, plan kullanımı ve depolama istatistikleri |
| **Taslaklar** | `/projects` | Aynı ajanstaki tüm muhabirlerin görebileceği haber taslakları listesi ve yeni taslak oluşturma formu |
| **Muhabirler** | `/users` | Ajana kayıtlı muhabirler ve ajans yöneticisinin yeni muhabir davet etme ekranı |
| **Faturalandırma** | `/billing` | Ajansın abonelik planı, kullanım limitleri ve plan yükseltme seçenekleri |
| **Mimari** | `/architecture` | Sistemin teknik mimarisi, şema izolasyon modeli ve güvenlik sınırları |
| **Hesap Bilgileri** | `/settings` | Ajans bilgileri ve izolasyon durumu |
| **Profil Ayarları** | `/profile` | Kullanıcı profil bilgileri ve hesap ayarları |

> Ekran görüntüleri `screenshots/` klasörüne kaydedilmiştir.

---

## 3. Kullanılan Teknolojiler

### Arka Uç (Backend)

| Teknoloji | Sürüm | Kullanım Amacı |
|---|---|---|
| **NestJS** | 10.x | Modüler REST API çerçevesi; Controller / Service / Module mimarisi |
| **TypeScript** | 5.x | Tip güvenliği ve derleme zamanı hata tespiti |
| **PostgreSQL** | 16 | Şema-başına-kiracı izolasyon modelini destekleyen ilişkisel veritabanı |
| **`pg` (node-postgres)** | 8.x | ORM kullanılmadan ham SQL; `SET search_path` ile çalışma zamanı şema değiştirme |
| **Passport.js + JWT** | — | Kiracı kimliğini token'a gömen, çapraz kiracı erişimini engelleyen kimlik doğrulama |
| **bcryptjs** | 2.x | Kullanıcı parolalarının güvenli hash'lenmesi |
| **class-validator** | — | DTO seviyesinde giriş doğrulaması (`ValidationPipe`) |

### Ön Uç (Frontend)

| Teknoloji | Sürüm | Kullanım Amacı |
|---|---|---|
| **Next.js** | 14 (App Router) | Sunucu-bileşen mimarisi, sayfa yönlendirme |
| **React** | 18 | Bileşen tabanlı kullanıcı arayüzü |
| **TypeScript** | 5.x | Tip güvenli frontend geliştirme |
| **TailwindCSS** | 3.x | Yardımcı sınıf tabanlı CSS; duyarlı (responsive) tasarım |

### Altyapı ve Araçlar

| Teknoloji | Kullanım Amacı |
|---|---|
| **Docker** | Her servis için yalıtılmış konteyner ortamı |
| **Docker Compose** | PostgreSQL + backend + frontend servislerini tek komutla orkestrasyon |
| **AsyncLocalStorage** | Node.js eş zamanlı isteklerinde kiracı bağlamını güvenle taşıma |

---

## 4. Kurulum Adımları

### 4.1 Ön Koşullar

Kuruluma başlamadan önce aşağıdakilerin yüklü olduğundan emin olun:

| Araç | Minimum Sürüm | İndirme |
|---|---|---|
| **Docker Desktop** | 24.x | https://www.docker.com/products/docker-desktop/ |
| **Docker Compose** | v2 (Docker ile birlikte gelir) | — |
| **Git** | 2.x | https://git-scm.com/ |

> Node.js veya PostgreSQL gibi bağımlılıkları **ayrıca kurmanıza gerek yoktur**; tümü Docker konteynerlerinde çalışır.

---

### 4.2 Depoyu Klonlayın

```bash
git clone https://github.com/kurdengarous/-Multi-Tenant-SaaS-Altyap-s-.git
cd "-Multi-Tenant-SaaS-Altyap-s-"
```

---

### 4.3 Ortam Değişkenlerini Yapılandırın (Opsiyonel)

Proje, varsayılan değerlerle **yapılandırma gerektirmeden** çalışır. İsterseniz ortam değişkenlerini özelleştirmek için:

```bash
# Linux / macOS
cp backend/.env.example backend/.env

# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```

`backend/.env.example` içeriği:

```env
DATABASE_URL=postgres://saas:saas@postgres:5432/saas
JWT_SECRET=change_me_in_production
PORT=4000
```

> **Güvenlik Notu:** `.env` dosyası `.gitignore` tarafından versiyon kontrolünden hariç tutulur.
> `JWT_SECRET` ve veritabanı parolası üretim ortamına taşımadan önce mutlaka değiştirilmelidir.

---

### 4.4 Docker İmajlarını Derleyin ve Konteynerleri Başlatın

```bash
docker compose up --build
```

İlk başlatmada arka uç **otomatik olarak** şu işlemleri gerçekleştirir:

1. `public` şemasında ortak tabloları oluşturur (`tenants`, `users`, `tenant_users`, `subscriptions`, `audit_log`)
2. Her haber ajansı için ayrı PostgreSQL şeması oluşturur (`tatvantv`, `ahlattv`, `norsintv`)
3. Her şemada ajansa özel tabloları oluşturur (`projects`, `resources`, `usage_logs`)
4. Örnek ajansları, yönetici/muhabir kullanıcıları, abonelikleri ve haber taslak örneklerini sisteme yükler

Sistemin hazır olduğunu aşağıdaki log satırıyla anlayabilirsiniz:

```
[saas-backend] listening on :4000
```

---

## 5. Nasıl Çalıştırılır

### 5.1 Servisleri Başlatma

```bash
# Tüm servisleri arka planda başlat
docker compose up -d

# Logları canlı izle
docker compose logs -f backend

# Servisleri durdur
docker compose down
```

### 5.2 Erişim Noktaları

| Servis | Adres | Açıklama |
|---|---|---|
| **Frontend (Panel)** | http://localhost:9000 | Tarayıcıdan erişilen kullanıcı arayüzü |
| **Backend (REST API)** | http://localhost:9001/api | NestJS API sunucusu |
| **API Sağlık Kontrolü** | http://localhost:9001/api/health | `{"ok":true}` döner |
| **PostgreSQL** | `localhost:5434` | Kullanıcı: `saas` · Parola: `saas` · Veritabanı: `saas` |

### 5.3 Varsayılan Giriş Bilgileri

Her ajans için varsayılan parola: **`password123`**

| Ajans | Rol | E-posta |
|---|---|---|
| **TatvanTV** | Yönetici (Patron) | `admin@tatvantv.app.local` |
| **TatvanTV** | Muhabir | `member@tatvantv.app.local` |
| **Ahlat TV** | Yönetici (Patron) | `admin@ahlattv.app.local` |
| **Ahlat TV** | Muhabir | `member@ahlattv.app.local` |
| **Norşin TV** | Yönetici (Patron) | `admin@norsintv.app.local` |
| **Norşin TV** | Muhabir | `member@norsintv.app.local` |

### 5.4 Kullanım Senaryosu

1. Tarayıcıda **http://localhost:9000** adresini açın.
2. Listeden bir haber ajansı seçin (örn. **TatvanTV**).
3. Yönetici hesabıyla giriş yapın (`admin@tatvantv.app.local` / `password123`).
4. **Taslaklar** menüsünden mevcut haber taslakları görüntülenebilir ve yeni taslak eklenebilir.
5. Aynı ajansın muhabiri (`member@tatvantv.app.local`) ile giriş yapıldığında aynı taslaklar görünür.
6. Farklı bir ajansa (`ahlattv`) geçildiğinde **yalnızca o ajansın** taslaklarına erişilebilir.

### 5.5 Kiracı İzolasyonunu API Üzerinden Test Edin

```bash
# 1. TatvanTV yöneticisi olarak giriş yap ve token al
TOKEN=$(curl -s -X POST http://localhost:9001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: tatvantv" \
  -d '{"email":"admin@tatvantv.app.local","password":"password123"}' \
  | jq -r .accessToken)

# 2. Aynı token ile farklı ajans başlığı gönder → 403 Forbidden beklenir
curl -i http://localhost:9001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant: ahlattv"
# HTTP/1.1 403 Forbidden — çapraz kiracı erişimi engellendi
```

---

## 6. Proje Yapısı Açıklaması

### 6.1 Depo Dosya Yapısı

```
-Multi-Tenant-SaaS-Altyap-s-/
│
├── README.md                   <-- ÖNEMLİ: Kurulum, kullanım ve açıklamalar
├── LICENSE                     <-- MIT Lisansı
├── .gitignore                  <-- Gizli ve gereksiz dosyaları repoya koyma
├── docker-compose.yml          <-- Tüm servislerin (DB + backend + frontend) orkestrasyonu
│
├── docs/
│   └── ARCHITECTURE.md         <-- Detaylı mimari dokümantasyon ve veri akış şeması
│
├── screenshots/                <-- Demo ekran görüntüleri
│
├── backend/                    <-- NestJS REST API
│   ├── package.json            <-- Bağımlılıklar ve script'ler
│   ├── tsconfig.json           <-- TypeScript yapılandırması
│   ├── nest-cli.json           <-- NestJS CLI yapılandırması
│   ├── Dockerfile              <-- Backend konteyner tarifi
│   ├── .env.example            <-- Ortam değişkeni şablonu
│   └── src/
│       ├── main.ts             <-- Uygulama başlangıç noktası; migration + seed tetikler
│       ├── app.module.ts       <-- Modülleri ve global TenantMiddleware'i bağlar
│       ├── common/
│       │   └── tenant-context.ts   <-- AsyncLocalStorage tabanlı kiracı bağlamı
│       ├── middleware/
│       │   └── tenant.middleware.ts <-- X-Tenant başlığından kiracıyı çözümler
│       ├── database/
│       │   ├── database.service.ts  <-- pg Pool; SET search_path ile şema yönlendirme
│       │   ├── migrations.service.ts <-- Tabloları ve şemaları oluşturur
│       │   └── seed.service.ts      <-- Örnek ajansları, kullanıcıları ve taslakları ekler
│       ├── auth/
│       │   ├── auth.controller.ts   <-- POST /api/auth/login
│       │   ├── auth.service.ts      <-- Parola doğrulama, JWT üretme
│       │   ├── jwt.strategy.ts      <-- Token doğrulama ve kiracı eşleşme kontrolü
│       │   └── jwt-auth.guard.ts    <-- Korumalı endpoint'lerde kullanılan guard
│       ├── tenants/
│       │   ├── tenants.controller.ts <-- GET /api/tenants, /api/health, /api/tenants/me
│       │   └── tenants.service.ts    <-- Ajans listesi, panel verileri
│       ├── users/
│       │   ├── users.controller.ts  <-- GET/POST /api/users (muhabir yönetimi)
│       │   └── users.service.ts     <-- Muhabir listeleme, davet etme; plan limiti kontrolü
│       ├── billing/
│       │   ├── billing.controller.ts <-- /api/billing/* endpoint'leri
│       │   ├── billing.service.ts    <-- Abonelik, kullanım; assertCanAdd* kontrolleri
│       │   └── plans.ts             <-- starter / pro / enterprise plan tanımları
│       └── projects/
│           ├── projects.controller.ts <-- GET/POST /api/projects (haber taslaklarıI)
│           └── projects.service.ts    <-- Taslak listeleme ve oluşturma; plan limiti kontrolü
│
└── frontend/                   <-- Next.js 14 kullanıcı arayüzü
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js          <-- NEXT_PUBLIC_API_URL yapılandırması
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── Dockerfile              <-- Frontend konteyner tarifi
    ├── app/
    │   ├── layout.tsx          <-- Global sayfa düzeni ve metadata
    │   ├── page.tsx            <-- Ajans seçim ekranı (/)
    │   ├── login/page.tsx      <-- Ajansa özel giriş ekranı (/login)
    │   ├── dashboard/page.tsx  <-- Ajans paneli: taslak/muhabir istatistikleri
    │   ├── projects/page.tsx   <-- Haber taslaklarını listele ve yeni taslak ekle
    │   ├── users/page.tsx      <-- Muhabir listesi ve yeni muhabir daveti
    │   ├── billing/page.tsx    <-- Abonelik planı ve kullanım limitleri
    │   ├── settings/page.tsx   <-- Ajans bilgileri ve izolasyon durumu
    │   └── architecture/page.tsx <-- Teknik mimari açıklama sayfası
    ├── components/
    │   └── Shell.tsx           <-- Sol kenar çubuğu, navigasyon ve izolasyon bandı
    └── lib/
        └── api.ts              <-- Her API isteğine X-Tenant + Bearer token ekler
```

---

### 6.2 Veritabanı Şema Modeli

Sistem, tek bir PostgreSQL veritabanı içinde **her ajans için ayrı şema** kullanır:

```
PostgreSQL veritabanı: saas
│
├── public şema (tüm ajansların ortak tabloları)
│   ├── tenants          → ajans adı, slug, şema adı
│   ├── users            → e-posta, parola hash, isim
│   ├── tenant_users     → kullanıcı-ajans-rol ilişkisi (admin/member)
│   ├── subscriptions    → plan, kullanıcı/proje/API limitleri
│   └── audit_log        → erişim denetim kaydı
│
├── tatvantv şema (TatvanTV'ye özel)
│   ├── projects         → haber taslakları
│   ├── resources        → ek kaynaklar
│   └── usage_logs       → API kullanım istatistikleri
│
├── ahlattv şema (Ahlat TV'ye özel)
│   └── ... (aynı tablo yapısı)
│
└── norsintv şema (Norşin TV'ye özel)
    └── ... (aynı tablo yapısı)
```

**Kiracı izolasyonu nasıl çalışır?**  
Her API isteğinde `SET search_path TO {ajans_slug}, public` komutu çalışır. Bu sayede `SELECT * FROM projects` sorgusu, bağlantı kuran ajansın şemasındaki `projects` tablosuna yönlendirilir. Başka bir ajansın verisine niteleyicisiz sorguyla erişmek fiziksel olarak imkânsızdır.

---

### 6.3 Temel Bileşenler ve Görevleri

| Bileşen | Dosya | Görevi |
|---|---|---|
| `TenantMiddleware` | `middleware/tenant.middleware.ts` | Her HTTP isteğinde `X-Tenant` başlığını okur, veritabanında doğrular, `AsyncLocalStorage`'a yazar |
| `TenantContext` | `common/tenant-context.ts` | `AsyncLocalStorage` sarmalayıcısı; eş zamanlı isteklerin birbirinin bağlamına karışmamasını sağlar |
| `DatabaseService` | `database/database.service.ts` | Her sorgu öncesi `SET search_path` çalıştırır; şema güvenliği için `safeSchema()` doğrulaması yapar |
| `JwtAuthGuard` + `JwtStrategy` | `auth/` | JWT imzası doğrulama + token'daki `tenantId` ile istek başlığını karşılaştırma (`assertTokenMatchesTenant`) |
| `BillingService` | `billing/billing.service.ts` | Her ekleme işleminden önce `assertCanAddUser()` / `assertCanAddProject()` ile plan limitini kontrol eder |
| `api.ts` (frontend) | `lib/api.ts` | Tüm frontend API çağrılarına `X-Tenant` ve `Authorization: Bearer` başlıklarını otomatik ekler |

---

## 7. Öne Çıkan Özellikler

### 7.1 Fiziksel Şema İzolasyonu ile Kesin Veri Güvenliği

PostgreSQL'in `SET search_path` mekanizması kullanılarak her haber ajansının verileri **ayrı bir veritabanı şemasında** tutulur. `tatvantv` kullanıcısı, SQL sorgularında tablo adını nitelese bile `ahlattv.projects` tablosuna doğrudan erişemez. Bu yaklaşım, satır seviyesi güvenlikten (RLS) çok daha güçlü bir izolasyon sağlar.

### 7.2 Çapraz Kiracı JWT Koruma Mekanizması

Giriş sırasında üretilen JWT token'ı, kullanıcının `tenantId` değerini içinde taşır. Korumalı bir endpoint'e yapılan her istekte `JwtStrategy`, token'daki `tenantId` ile `X-Tenant` başlığındaki ajansı karşılaştırır. Uyuşmazlık varsa istek `403 Forbidden` ile anında reddedilir. Bu sayede çalınmış bir token bile başka bir ajansa erişim sağlayamaz.

### 7.3 AsyncLocalStorage ile Güvenli Eş Zamanlılık

Node.js'in tek iş parçacıklı asenkron modelinde, farklı ajansların eş zamanlı istekleri kiracı bağlamını birbirine karıştırabilir. `AsyncLocalStorage` kullanılarak her istek kendi kiracı bağlamını async çağrı zincirleri boyunca güvenle taşır.

### 7.4 Plan Tabanlı Kullanım Limiti

Her ajansın bir abonelik planı vardır (`starter`, `pro`, `enterprise`). Yeni muhabir veya haber taslağı eklemek istendiğinde `BillingService` önce planın limitini kontrol eder; kota dolmuşsa `402 Payment Required` hatası döner. Böylece sistem, iş kurallarını uygulama katmanında zorlar.

### 7.5 Yeni Ajans Eklemenin Kolayllığı

Yeni bir haber ajansı eklemek için yeni bir sunucu, konteyner veya veritabanı kurmak gerekmez. `seed.service.ts`'e yeni bir satır eklemek yeterlidir; sistem ilk başlatmada `CREATE SCHEMA` ve gerekli tabloları otomatik oluşturur.

### 7.6 Otomatik Migration ve Seed

Uygulama her başlatıldığında `MigrationsService` ve `SeedService` otomatik çalışır. Bu sayede geliştirici, veritabanını manuel olarak kurmak zorunda kalmaz; `docker compose up --build` komutu tek başına tam çalışır bir sistem sunar.

---

## 8. Karşılaşılan Zorluklar ve Çözümler

### Zorluk 1: Eş Zamanlı İsteklerde Kiracı Bağlamının Karışması

**Sorun:** Node.js tek bir işlemde birden fazla ajansın isteğini eş zamanlı işler. Global bir değişkende kiracı bilgisi saklanırsa, istek A'nın kiracısı istek B'nin sorgusuna karışabilir.

**Çözüm:** Node.js 16+ ile gelen `AsyncLocalStorage` API'si kullanıldı. Her gelen HTTP isteği için `TenantMiddleware`, `AsyncLocalStorage`'a `run()` çağrısıyla yeni bir bağlam başlatır. Bu bağlam, tüm async/await çağrı zinciri boyunca (servisler, veritabanı sorguları) korunur ve diğer isteklerle kesinlikle çakışmaz.

### Zorluk 2: ORM'lerin Dinamik Şema Değişimine Destek Vermemesi

**Sorun:** Prisma ve TypeORM gibi popüler ORM'ler, bağlantı kurulduktan sonra `search_path`'i dinamik olarak değiştirmeyi desteklemez. Şema başına model tanımlamaları tutarsızlığa yol açar.

**Çözüm:** Ham `pg` (node-postgres) sürücüsü kullanıldı. `DatabaseService.tenantQuery()` metodu, her sorgu çalıştırılmadan önce aynı bağlantı üzerinden `SET search_path TO {ajans_slug}, public` komutunu çalıştırır. Bu yaklaşım tam kontrol ve sıfır ORM bağımlılığı sağlar.

### Zorluk 3: Çapraz Kiracı Token Yeniden Oynatma Saldırısı

**Sorun:** Bir ajansın JWT token'ı ele geçirilirse, saldırgan aynı token ile farklı bir ajansın endpoint'ine istek gönderebilir.

**Çözüm:** `auth.service.ts`'deki `assertTokenMatchesTenant()` metodu, her korumalı istekte JWT payload'undaki `tenantId` ile `X-Tenant` başlığındaki ajansın veritabanı ID'sini karşılaştırır. Uyuşmazlık durumunda `403 Forbidden` döner ve işlem hiçbir zaman veritabanına ulaşmaz.

### Zorluk 4: Port Çakışması ve Docker Ağ Sorunları

**Sorun:** Geliştirme makinesinde başka projeler `5432`, `3000` gibi standart portları kullanıyordu. Ayrıca backend konteyneri, PostgreSQL hazır olmadan başlayıp çöküyordu.

**Çözüm:** `docker-compose.yml`'de port eşlemeleri özelleştirildi (`9000:3000`, `9001:4000`, `5434:5432`). Backend servisine `restart: unless-stopped` politikası eklendi; PostgreSQL'in `healthcheck` mekanizması tamamlanana kadar backend yeniden başlar.

### Zorluk 5: Next.js Build Zamanı API URL Sabitleme

**Sorun:** `NEXT_PUBLIC_API_URL` ortam değişkeni, Next.js'de `next build` sırasında JavaScript bundle'a gömülür. Konteyner içinde build yapıldığında `localhost` yerine container adı (`backend`) kullanılması gerekiyordu; ancak tarayıcıdan `backend` adresi çözümlenemez.

**Çözüm:** `next.config.js`'de `NEXT_PUBLIC_API_URL` için `http://localhost:9001/api` varsayılanı tanımlandı. Frontend Dockerfile'ı bu değeri build aşamasında alır; tarayıcı istekleri Docker ağı yerine host makinesinin `localhost:9001` adresine gider.

---

## 9. Kaynaklar

Proje geliştirilirken yararlanılan kaynaklar:

| Kaynak | Konu |
|---|---|
| [NestJS Resmi Dokümantasyonu](https://docs.nestjs.com/) | Modül, Controller, Service, Middleware, Guard mimarisi |
| [NestJS JWT Kimlik Doğrulama Rehberi](https://docs.nestjs.com/security/authentication) | Passport.js entegrasyonu ve JWT strategy |
| [Next.js 14 App Router Dokümantasyonu](https://nextjs.org/docs/app) | Sayfa yönlendirme, sunucu bileşenleri, `use client` direktifi |
| [PostgreSQL — Şemalar ve search_path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH) | Kiracı başına şema izolasyon modeli |
| [node-postgres (`pg`) Dokümantasyonu](https://node-postgres.com/) | Ham SQL sorguları ve bağlantı havuzu yönetimi |
| [Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage) | Eş zamanlı isteklerde güvenli bağlam yönetimi |
| [TailwindCSS Dokümantasyonu](https://tailwindcss.com/docs) | Yardımcı sınıf tabanlı CSS tasarımı |
| [Docker Compose Referans](https://docs.docker.com/compose/compose-file/) | Çok servisli uygulama orkestrasyonu |
| [bcryptjs npm Paketi](https://www.npmjs.com/package/bcryptjs) | Parola hash'leme |
| [class-validator Dokümantasyonu](https://github.com/typestack/class-validator) | DTO ve giriş doğrulaması |
| [Multi-Tenant Architecture Patterns (Martin Fowler)](https://martinfowler.com/articles/patterns-of-distributed-systems/) | Çok kiracılı mimari tasarım desenleri |

---

## 10. Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Ayrıntılar için [`LICENSE`](./LICENSE) dosyasına bakınız.

```
MIT License © 2025 — Akademik Proje (Web Programlama Dersi Final Ödevi)
```

> **Üretim Ortamı Uyarısı:** Bu proje bir ders kapsamında hazırlanmıştır.
> Gerçek bir ortama taşımadan önce `JWT_SECRET`, veritabanı parolası ve
> tüm ortam değişkenlerinin güçlü değerlerle değiştirilmesi zorunludur.
