import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Quick PRD 原型',
  description: '从 PRD 快速生成可运行的前端交互示例',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={dmSans.variable}>
      <body className={dmSans.className}>
        <Providers>
          <div className="app-root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
