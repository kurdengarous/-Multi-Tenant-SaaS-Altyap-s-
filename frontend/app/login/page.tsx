'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getTenant, setToken } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [tenant, setT] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('password123');
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    const t = getTenant();
    if (!t) { router.push('/'); return; }
    setT(t); setEmail(`admin@${t}.app.local`);
  }, [router]);

  async function submit(e: any) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api.post('/auth/login', { email, password: pw });
      setToken(r.accessToken);
      router.push('/dashboard');
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (!tenant) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md">
        <div className="text-xs text-white/50 uppercase">Giriş</div>
        <h1 className="text-2xl font-bold mb-1">{tenant}.app.local</h1>
        <p className="text-xs text-amber-300/80 mb-6">
          Burada üretilen token <span className="kbd">{tenant}</span> kiracısına bağlıdır.
          Başka bir kiracıya karşı tekrar oynatılırsa 403 döner.
        </p>
        <label className="label">E-posta</label>
        <input className="input mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="label">Parola</label>
        <input className="input mb-4" type="password" value={pw} onChange={e => setPw(e.target.value)} />
        {err && <div className="text-red-300 text-sm mb-3">{err}</div>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
        <button type="button" className="btn btn-ghost w-full mt-2"
          onClick={() => { localStorage.removeItem('tenant'); router.push('/'); }}>
← Farklı bir çalışma alanı seç
        </button>
      </form>
    </div>
  );
}
