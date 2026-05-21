'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTenant, logout } from '@/lib/api';

const NAV = [
  { href: '/dashboard',    label: 'Panel' },
  { href: '/projects',     label: 'Haberler' },
  { href: '/users',        label: 'Muhabirler' },
  { href: '/billing',      label: 'Faturalandırma' },
  { href: '/settings',     label: 'Ayarlar' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [tenant, setT] = useState<string | null>(null);
  useEffect(() => { setT(getTenant()); }, [path]);

  if (!tenant) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1020]">
      {/* Üst Navigasyon Çubuğu */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-xs text-white/50 leading-none">Ajans</span>
              <span className="text-xl font-bold text-brand-400">{tenant}.ajans</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${path === n.href ? 'bg-brand-600 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile" 
              className={`px-4 py-2 rounded-lg text-sm transition-colors border border-white/10 ${path === '/profile' ? 'bg-brand-600 text-white' : 'hover:bg-white/5 text-white/80'}`}>
              👤 Profilim
            </Link>
            <button className="btn btn-ghost text-xs border border-white/10 hover:bg-red-500/10 hover:text-red-400" onClick={() => {
              logout();
              const host = window.location.hostname;
              if (host.includes('localhost') && host !== 'localhost') {
                const port = window.location.port;
                window.location.href = `${window.location.protocol}//localhost${port ? `:${port}` : ''}`;
              } else {
                router.push('/');
              }
            }}>Çıkış</button>
          </div>
        </div>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Alt Bilgi (Güvenlik İzolasyon Bandı) */}
      <footer className="border-t border-white/10 p-3 bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-[11px] text-amber-300/40">
           <span>🛡️ İzolasyon Sınırı Aktif</span>
           <span className="opacity-40">|</span>
           <span>İstekler <span className="kbd bg-white/5 border-white/10 text-amber-200/50">X-Tenant: {tenant}</span></span>
           <span className="opacity-40">|</span>
           <span>Veritabanı: <span className="kbd bg-white/5 border-white/10 text-amber-200/50">search_path={tenant}</span></span>
        </div>
      </footer>
    </div>
  );
}
