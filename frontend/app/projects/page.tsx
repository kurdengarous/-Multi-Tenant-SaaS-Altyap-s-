'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Projects() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr]   = useState('');

  async function load() {
    try { setList(await api.get('/projects')); }
    catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: any) {
    e.preventDefault(); setErr('');
    try {
      await api.post('/projects', { name, description: desc });
      setName(''); setDesc(''); load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Projeler</h1>
      <p className="text-white/60 text-sm">
        <span className="kbd">&lt;kiracı&gt;.projects</span> tablosunda saklanır — her kiracı için fiziksel olarak farklı bir tablo.
      </p>

      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-semibold">Yeni proje</h2>
        <input className="input" placeholder="Ad" value={name} onChange={e => setName(e.target.value)} required />
        <input className="input" placeholder="Açıklama" value={desc} onChange={e => setDesc(e.target.value)} />
        {err && <div className="text-red-300 text-sm">{err}</div>}
        <button className="btn btn-primary">Oluştur</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Mevcut</h2>
        <ul className="divide-y divide-white/10">
          {list.map(p => (
            <li key={p.id} className="py-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-white/60">{p.description}</div>
            </li>
          ))}
          {list.length === 0 && <li className="py-3 text-white/50">Henüz proje yok.</li>}
        </ul>
      </div>
    </div>
  );
}
