import './globals.css';
import Shell from '@/components/Shell';

export const metadata = { title: 'Çok Kiracılı SaaS', description: 'Kiracı başına şema demosu' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
