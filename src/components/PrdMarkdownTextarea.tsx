import { Input } from 'antd';
import React from 'react';

export type PrdMarkdownTextareaProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  /** 设置后高度随内容变化（如系统提示词）；不设则由外层 flex 撑满（如需求描述） */
  autoSize?: { minRows: number; maxRows: number };
};

/** 轻量 Markdown 原文编辑（纯文本），替代 Milkdown，显著减小打包体积 */
export const PrdMarkdownTextarea: React.FC<PrdMarkdownTextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  autoSize,
}) => (
  <Input.TextArea
    className="prd-markdown-textarea"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    spellCheck={false}
    autoSize={autoSize}
  />
);
