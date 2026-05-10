'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setTenant } from '@/lib/api';

type Tenant = { slug: string; name: string; plan: string };

export default function WorkspaceSelector() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [err, setErr] = useState('');
  const router = useRouter();

  useEffect(() => {
    api.get('/tenants').then(setTenants).catch(e => setErr(e.message));
  }, []);

  function pick(t: Tenant) {
    setTenant(t.slug);
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-2">Çok Kiracılı SaaS</h1>
        <p className="text-white/70 mb-8">
          Bir çalışma alanı seçin. Her kiracı kendi PostgreSQL şemasında yaşar —
          isteseniz bile başka bir kiracının verisini okuyamazsınız.
        </p>
        {err && <div className="card border-red-400/30 text-red-300 mb-4">{err}</div>}
        <div className="grid gap-4 md:grid-cols-3">
          {tenants.map(t => (
            <button key={t.slug} onClick={() => pick(t)}
              className="card text-left hover:border-brand-500 transition">
              <div className="text-xs text-white/50 uppercase">{t.slug}.app.local</div>
              <div className="text-xl font-semibold mt-1">{t.name}</div>
              <div className="mt-4 inline-block px-2 py-0.5 rounded bg-brand-600/30 text-brand-500 text-xs uppercase">
                {t.plan} planı
              </div>
            </button>
          ))}
        </div>
        <p className="mt-10 text-sm text-white/50">
          Her kiracı için varsayılan kimlik bilgileri:&nbsp;
          <span className="kbd">admin@&lt;slug&gt;.app.local</span> /&nbsp;
          <span className="kbd">password123</span>
        </p>
      </div>
    </div>
  );
}
