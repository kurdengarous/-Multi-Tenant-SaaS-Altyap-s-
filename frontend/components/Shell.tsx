'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTenant, logout } from '@/lib/api';

const NAV = [
  { href: '/dashboard',    label: 'Panel' },
  { href: '/projects',     label: 'Projeler' },
  { href: '/users',        label: 'Kullanıcılar' },
  { href: '/billing',      label: 'Faturalandırma' },
  { href: '/settings',     label: 'Ayarlar' },
  { href: '/architecture', label: 'Mimari' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [tenant, setT] = useState<string | null>(null);
  useEffect(() => { setT(getTenant()); }, [path]);

  if (!tenant) return <>{children}</>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-white/10 p-5 hidden md:flex md:flex-col gap-4">
        <div>
          <div className="text-xs text-white/50">Çalışma alanı</div>
          <div className="text-2xl font-bold">{tenant}.app</div>
          <div className="mt-1 text-xs text-emerald-400">şema: <span className="kbd">{tenant}</span></div>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`px-3 py-2 rounded-lg text-sm ${path === n.href ? 'bg-brand-600 text-white' : 'hover:bg-white/5 text-white/80'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button className="btn btn-ghost text-sm" onClick={() => { logout(); router.push('/'); }}>
            Kiracı değiştir / Çıkış
          </button>
          <p className="text-[11px] text-amber-300/80 leading-snug">
            İzolasyon sınırı aktif. İstekler
            <span className="kbd ml-1">X-Tenant: {tenant}</span> ile etiketleniyor ve
            sorgular <span className="kbd">search_path={tenant}</span> ile çalışıyor.
          </p>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
