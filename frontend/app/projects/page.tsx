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

  async function remove(id: string) {
    if (!confirm('Haberi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/projects/${id}`);
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function update(p: any) {
    const n = prompt('Yeni haber başlığı:', p.name);
    if (n === null) return;
    const d = prompt('Yeni haber detayı:', p.description);
    if (d === null) return;
    try {
      await api.put(`/projects/${p.id}`, { name: n, description: d });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Haber Taslakları</h1>
      <p className="text-white/60 text-sm">
        Ajans bünyesindeki muhabirlerin hazırladığı haber taslakları. Her ajans (kiracı) sadece kendi haberlerini görür.
      </p>

      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-semibold">Yeni Haber</h2>
        <input className="input" placeholder="Haber Başlığı" value={name} onChange={e => setName(e.target.value)} required />
        <textarea 
          className="input min-h-[100px]" 
          placeholder="Haber Detayı" 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
        />
        {err && <div className="text-red-300 text-sm">{err}</div>}
        <button className="btn btn-primary">Haber Taslağı Oluştur</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Mevcut Haberler</h2>
        <ul className="divide-y divide-white/10">
          {list.map(p => (
            <li key={p.id} className="py-3 flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-medium text-lg text-brand-300">{p.name}</div>
                <div className="text-sm text-white/60 mt-1 whitespace-pre-wrap">{p.description}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => update(p)} className="btn btn-ghost btn-sm text-xs">Düzenle</button>
                <button onClick={() => remove(p.id)} className="btn btn-ghost btn-sm text-xs text-red-400 hover:text-red-300">Sil</button>
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="py-3 text-white/50">Henüz haber taslağı yok.</li>}
        </ul>
      </div>
    </div>
  );
}
