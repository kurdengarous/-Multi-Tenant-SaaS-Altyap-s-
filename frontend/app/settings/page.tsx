'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Settings() {
  const [info, setInfo] = useState<any>(null);
  useEffect(() => { api.get('/me/tenant').then(setInfo); }, []);
  if (!info) return <div className="text-white/60">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Kiracı ayarları</h1>
      <div className="card grid grid-cols-2 gap-3 text-sm">
        <div className="text-white/50">Görünen ad</div><div>{info.name}</div>
        <div className="text-white/50">Kısa ad (slug)</div><div className="kbd">{info.slug}</div>
        <div className="text-white/50">Şema</div><div className="kbd">{info.schema_name}</div>
        <div className="text-white/50">Plan</div><div className="kbd">{info.plan}</div>
        <div className="text-white/50">Kiracı ID</div><div className="font-mono text-xs break-all">{info.id}</div>
      </div>
      <div className="card border-amber-400/30">
        <div className="font-semibold text-amber-300 mb-1">İzolasyon durumu</div>
        <p className="text-sm text-white/70">
          Kimlik doğruluk her istek çalışmadan önce
          <span className="kbd ml-1">SET search_path TO {info.schema_name}, public</span>
          komutunu çalıştırır. Kiracı verileri fiziksel olarak ayrıştırılmıştır;
          bir sorgudaki SQL hatası başka bir kiracının satırlarını döndüremez.
        </p>
      </div>
    </div>
  );
}
