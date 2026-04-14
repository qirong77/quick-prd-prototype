'use client';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <ConfigProvider locale={zhCN}>{children}</ConfigProvider>;
}
