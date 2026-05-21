'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Users() {
  const [list, setList] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [role, setRole]   = useState<'admin' | 'member'>('member');
  const [password, setPassword] = useState('');
  const [err, setErr]     = useState('');

  async function load() {
    try { 
      setList(await api.get('/users')); 
    }
    catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function invite(e: any) {
    e.preventDefault(); setErr('');
    try {
      await api.post('/users', { email, name, role, password });
      setEmail(''); setName(''); setPassword(''); load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Muhabirler</h1>
      <p className="text-white/60 text-sm">
        Ajans bünyesinde görev yapan muhabirler. Her ajansın kendi muhabir listesi izoledir.
      </p>

      <form onSubmit={invite} className="card grid gap-3 md:grid-cols-4">
        <input className="input md:col-span-2" placeholder="eposta@ornek.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="input" placeholder="Ad" value={name} onChange={e => setName(e.target.value)} />
        <select className="input" value={role} onChange={e => setRole(e.target.value as any)}>
          <option value="member">Üye</option>
          <option value="admin">Yönetici</option>
        </select>
        <input className="input md:col-span-2" type="password" placeholder="Başlangıç Şifresi" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-primary md:col-span-2">Davet et (yalnızca yönetici)</button>
        {err && <div className="text-red-300 text-sm md:col-span-4">{err}</div>}
      </form>

      <div className="card">
        <table className="w-full text-sm">
          <thead className="text-left text-white/50">
            <tr><th className="pb-2">E-posta</th><th>Ad</th><th>Rol</th></tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <span className={`kbd ${u.role === 'admin' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : ''}`}>
                    {u.role === 'admin' ? 'Yönetici' : 'Üye'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
