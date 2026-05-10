'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [u, setU] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api.get('/me/dashboard'), api.get('/billing/usage')])
      .then(([d, u]) => { setD(d); setU(u); })
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="card border-red-400/30 text-red-300">{err}</div>;
  if (!d || !u) return <div className="text-white/60">Yükleniyor…</div>;

  const stat = (label: string, value: any, hint?: string) => (
    <div className="card">
      <div className="text-xs text-white/50 uppercase">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/50 mt-1">{hint}</div>}
    </div>
  );

  const bar = (used: number, max: number) => {
    const pct = Math.min(100, Math.round((used / Math.max(max, 1)) * 100));
    return (
      <div className="h-2 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{d.tenant.slug}.app paneli</h1>
        <p className="text-white/60">
          PostgreSQL şeması <span className="kbd">{d.tenant.schema}</span>{' '}
          üzerinden, plan <span className="kbd">{d.tenant.plan}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stat('Projeler', d.counts.projects, `sınır ${u.limits.max_projects}`)}
        {stat('Kullanıcılar', d.counts.users, `sınır ${u.limits.max_users}`)}
        {stat('Kaynaklar', d.counts.resources)}
        {stat('Depolama',  `${d.counts.storage_mb_used} MB`, `sınır ${u.limits.storage_mb} MB`)}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Plan kullanımı</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Projeler</span><span>{u.used.projects} / {u.limits.max_projects}</span></div>
            {bar(u.used.projects, u.limits.max_projects)}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Kullanıcılar</span><span>{u.used.users} / {u.limits.max_users}</span></div>
            {bar(u.used.users, u.limits.max_users)}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Depolama</span><span>{u.used.storage_mb} / {u.limits.storage_mb} MB</span></div>
            {bar(u.used.storage_mb, u.limits.storage_mb)}
          </div>
        </div>
      </div>
    </div>
  );
}
