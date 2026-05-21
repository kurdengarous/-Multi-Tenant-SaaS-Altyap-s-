'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Profile() {
  const [me, setMe] = useState<any>(null);
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      setMe(await api.get('/users/me'));
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changePassword(e: any) {
    e.preventDefault();
    setPassMsg('');
    try {
      await api.post('/users/change-password', { password: newPass });
      setNewPass('');
      setPassMsg('Şifre başarıyla güncellendi.');
    } catch (e: any) {
      setPassMsg('Hata: ' + e.message);
    }
  }

  if (err) return <div className="text-red-400">Hata: {err}</div>;
  if (!me) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profil Ayarları</h1>
      <p className="text-white/60 text-sm">
        Kişisel bilgilerinizi ve giriş şifrenizi buradan yönetebilirsiniz.
      </p>

      <div className="card border-brand-500/30 bg-brand-500/5">
        <h2 className="text-xl font-bold mb-4">Giriş Yapılan Hesap</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="label">Ad Soyad</p>
              <div className="text-lg font-medium">{me.name}</div>
            </div>
            <div>
              <p className="label">E-posta Adresi</p>
              <div className="text-white/80">{me.email}</div>
            </div>
            <div>
              <p className="label">Mevcut Rol</p>
              <span className="kbd bg-brand-500/20 text-brand-300">
                {me.role === 'admin' ? 'Yönetici' : 'Üye'}
              </span>
            </div>
          </div>

          <form onSubmit={changePassword} className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-8 pt-6 md:pt-0">
            <h3 className="font-semibold text-brand-300">Şifre Değiştir</h3>
            <div>
              <p className="label">Yeni Şifre</p>
              <input
                className="input"
                type="password"
                placeholder="Yeni şifrenizi girin"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-full">Şifreyi Güncelle</button>
            {passMsg && (
              <div className={`text-sm ${passMsg.startsWith('Hata') ? 'text-red-400' : 'text-emerald-400'}`}>
                {passMsg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
