'use client';

import { ClickToComponent } from 'click-to-react-component-next';

/** 开发时 Option/Alt + 点击元素可跳转至源码（Cursor） */
export function ClickToReactComponent() {
  return <ClickToComponent editor="cursor" />;
}
