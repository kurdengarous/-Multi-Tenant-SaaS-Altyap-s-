'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Billing() {
  const [plans, setPlans] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  async function load() {
    setPlans(await api.get('/billing/plans'));
    setUsage(await api.get('/billing/usage'));
  }
  useEffect(() => { load().catch(e => setErr(e.message)); }, []);

  async function change(plan: string) {
    setBusy(true); setErr('');
    try { await api.post('/billing/change-plan', { plan }); await load(); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (!plans || !usage) return <div className="text-white/60">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Faturalandırma & abonelik</h1>
      <p className="text-white/60 text-sm">
        Mevcut plan: <span className="kbd">{usage.plan}</span>. Sınırlar, kiracı şemasına
        her insert'ten önce sunucu tarafında zorunlu kılınır.
      </p>
      {err && <div className="card border-red-400/30 text-red-300">{err}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(plans).map(([name, p]: any) => {
          const active = name === usage.plan;
          return (
            <div key={name} className={`card ${active ? 'border-brand-500' : ''}`}>
              <div className="text-xs text-white/50 uppercase">{name}</div>
              <ul className="mt-3 space-y-1 text-sm">
                <li>{p.max_users} kullanıcı</li>
                <li>{p.max_projects} proje</li>
                <li>günlük {p.api_limit.toLocaleString()} API çağrısı</li>
                <li>{p.storage_mb} MB depolama</li>
              </ul>
              <button disabled={busy || active} className="btn btn-primary w-full mt-4 disabled:opacity-50"
                onClick={() => change(name)}>
                {active ? 'Mevcut plan' : `${name} planına geç`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
