# Sistem Mimarisi — Çok Kiracılı Haber Ajansı Taslak Yönetim Sistemi

## Genel Bakış

Bu sistem, birden fazla bağımsız haber ajansının (kiracı/tenant) **tek bir uygulama altyapısı** üzerinden
yönetilmesini sağlar. Her ajans, fiziksel olarak birbirinden izole edilmiş kendi PostgreSQL şemasında çalışır.

---

## Mimari Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│                    İstemci (Browser)                        │
│              Next.js 14 — http://localhost:9000             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (X-Tenant başlığı + JWT)
┌────────────────────────▼────────────────────────────────────┐
│                  NestJS REST API                             │
│              http://localhost:9001/api                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TenantMiddleware  →  TenantContext (AsyncLocalStorage)│  │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JwtAuthGuard  →  assertTokenMatchesTenant()          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  BillingService  →  assertCanAddUser/Project()        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SET search_path TO {ajans_şeması}, public
┌────────────────────────▼────────────────────────────────────┐
│                 PostgreSQL 16                               │
│                                                             │
│   public şema:                                              │
│     tenants · users · tenant_users · subscriptions          │
│     audit_log                                               │
│                                                             │
│   tatvantv şema:   projects · resources · usage_logs        │
│   ahlattv şema:    projects · resources · usage_logs        │
│   norsintv şema:   projects · resources · usage_logs        │
└─────────────────────────────────────────────────────────────┘
```

---

## Kiracı İzolasyon Mekanizması

1. Her HTTP isteğinde `X-Tenant: {ajans-slug}` başlığı okunur.
2. `TenantMiddleware`, slug'ı veritabanında doğrular ve `AsyncLocalStorage`'a yazar.
3. `DatabaseService.tenantQuery()` metodu, her sorgudan önce `SET search_path TO {şema}, public` çalıştırır.
4. Bu sayede `SELECT * FROM projects` sorgusu otomatik olarak ilgili ajansın şemasına yönlendirilir.
5. JWT içindeki `tenantId`, istek başlığındaki kiracıyla karşılaştırılır — uyuşmazsa `403 Forbidden` döner.

---

## Veri Akışı: Haber Taslağı Oluşturma

```
Muhabir → Giriş (JWT alır) → Taslak oluştur (POST /api/projects)
    ↓
BillingService.assertCanAddProject() — Plan limiti kontrolü
    ↓
DatabaseService.tenantQuery() — SET search_path TO {ajans}
    ↓
INSERT INTO projects (name, description, created_by) → Ajansa özgü şema
    ↓
Aynı ajanstaki diğer muhabirler GET /api/projects ile taslakları görür
    ↓
Ajans sahibi (admin) panelden tüm taslakları ve istatistikleri izler
```
