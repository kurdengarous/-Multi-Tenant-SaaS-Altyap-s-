'use client';
import { getTenant } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Architecture() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => { setT(getTenant()); }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Sistem mimarisi</h1>
      <p className="text-white/60">
        <span className="kbd">{t || 'kiracı'}.app.local</span> üzerinden gelen bir isteğin sistemde
        nasıl akıp her adımda izolasyonun nasıl zorlandığını gösteren şema.
      </p>

      <div className="card">
        <pre className="text-xs leading-relaxed whitespace-pre overflow-x-auto">
{`            ┌────────────────────────┐
  Tarayıcı → │  Next.js (önyüz)         │ → ekler:  X-Tenant: ${t || '<slug>'}
            └──────────┬─────────────┘            Authorization: Bearer <jwt>
                       │
                       ▼
            ┌────────────────────────┐
            │  TenantMiddleware      │ 1. X-Tenant / alt-alan oku
            │   (her istekte çalışır)│ 2. slug ile kiracıyı SELECT et
            │                        │ 3. TenantContext'i bağla (AsyncLocalStorage)
            └──────────┬─────────────┘
                       ▼
            ┌────────────────────────┐
            │  JwtAuthGuard          │  token imzasını doğrular
            │  + JwtStrategy         │  VE  payload.tenantId == ctx.tenantId
            └──────────┬─────────────┘  ← çapraz kiracı token kullanımı = 403
                       ▼
            ┌────────────────────────┐
            │  Servis katmanı       │  db.tenantQuery(...) çağırır
            └──────────┬─────────────┘
                       ▼
            ┌────────────────────────┐
            │  pg.Pool istemcisi     │  SET search_path TO ${t || '<şema>'}, public
            │                        │  → niteleyicisiz \`projects\` artık
            │                        │    yalnızca ${t || '<şema>'}.projects'i çözer
            └──────────┬─────────────┘
                       ▼
            ┌────────────────────────────────────────────┐
            │  PostgreSQL                                    │
            │  ─ public.tenants / users / tenant_users        │
            │  ─ public.subscriptions                         │
            │  ─ public.audit_log    (satır-düzeyi demosu)     │
            │  ─ tatvantv.projects / resources / usage_logs   │
            │  ─ ahlattv.projects  / resources / usage_logs   │
            │  ─ norsintv.projects / resources / usage_logs   │
            └────────────────────────────────────────────┘`}
        </pre>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold mb-2">Kiracı başına şema (birincil)</h3>
          <p className="text-sm text-white/70">
            Güçlü fiziksel ayrım. Bir sorgudaki hata, başka bir kiracının satırlarını
            sızdıramaz çünkü o tablo zaten search_path üzerinde değildir. Yedekleme,
            geri yükleme ve PITR kiracı bazında yapılabilir.
            Ödün: kiracı oluştururken daha fazla DDL; çapraz kiracı analitik daha zor.
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Satır düzeyi (yalnızca demo)</h3>
          <p className="text-sm text-white/70">
            <span className="kbd">public.audit_log</span>, tüm kiracıları tek bir
            tabloda <span className="kbd">tenant_id</span> kolonuyla saklar.
            Daha ucuz, ama her sorgu tenant_id'ye göre filtrelemek ZORUNDA — bir
            eksik WHERE cümlesi ve veri sızdı. Yalnızca paylaşılan, hassas olmayan
            kayıtlar için kullanıyoruz.
          </p>
        </div>
      </div>

      <div className="card border-amber-400/30">
        <h3 className="font-semibold text-amber-300 mb-2">Zorunlu kılınan güvenlik sınırları</h3>
        <ul className="text-sm text-white/80 list-disc list-inside space-y-1">
          <li>Kiracı slug'ı şema adı olarak kullanılmadan önce regex ile beyaz listeye alınır — host başlığı üzerinden SQL injection olamaz.</li>
          <li>JWT, <span className="kbd">tenantId</span>'ye bağlıdır; eşleşmeyen kiracı ⇒ <span className="kbd">403 Forbidden</span>.</li>
          <li>Kiracı kapsamlı servisler, <span className="kbd">TenantContext</span> ayarlanmamışsa çalışmayı reddeder.</li>
          <li>Plan limitleri, kiracı şemasına herhangi bir insert yapılmadan <em>önce</em> sunucu tarafında kontrol edilir.</li>
        </ul>
      </div>
    </div>
  );
}
