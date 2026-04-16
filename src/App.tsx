'use client';

import { Layout, message, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'antd/dist/antd.css';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { streamAnthropicAssistantText, type StreamAttachment } from './lib/anthropicStream';
import { getAnthropicModelIds, getDefaultAnthropicModelId } from './lib/modelList';
import { getDefaultCodeForTemplateKey } from './template/readDefaultCode';
import { SYSTEM_PROMPT } from './prompts/system';
import { getDefaultTemplateKey, getTemplate } from './template';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const modelIds = useMemo(() => getAnthropicModelIds(), []);
  const [modelId, setModelId] = useState(() => getDefaultAnthropicModelId(modelIds));
  const [templateKey, setTemplateKey] = useState(() => getDefaultTemplateKey());

  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidthPx, setLeftWidthPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const leftEl = containerRef.current?.querySelector('.app-panel-left') as HTMLElement | null;
    const currentWidth = leftEl?.getBoundingClientRect().width ?? 400;
    dragStartRef.current = { x: e.clientX, width: currentWidth };
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const delta = ev.clientX - dragStartRef.current.x;
      const newWidth = Math.max(260, Math.min(containerWidth - 280 - 20, dragStartRef.current.width + delta));
      setLeftWidthPx(newWidth);
    };

    const onMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const [prdText, setPrdText] = useState(() => getTemplate().instructions);
  const [systemPrompt, setSystemPrompt] = useState(() => {
    const t = getTemplate();
    const sp = t.systemPrompt.trim();
    return sp ? t.systemPrompt : SYSTEM_PROMPT;
  });

  useEffect(() => {
    const t = getTemplate(templateKey);
    const sp = t.systemPrompt.trim();
    setSystemPrompt(sp ? t.systemPrompt : SYSTEM_PROMPT);
    setPrdText(t.instructions);
  }, [templateKey]);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewTabKey, setPreviewTabKey] = useState('preview');
  const [generateAttachments, setGenerateAttachments] = useState<StreamAttachment[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const onGenerate = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPreviewTabKey('log');
    setLoading(true);
    setStreamingText('');
    try {
      const full = await streamAnthropicAssistantText(
        {
          prdText,
          systemPrompt,
          model: modelId,
          templateKey,
          attachments: generateAttachments.length ? generateAttachments : undefined,
        },
        (acc) => setStreamingText(acc),
        ac.signal,
      );
      setStreamingText(full);
      setPreviewTabKey('preview');
      message.success('生成完成');
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        message.info('已停止');
      } else {
        message.error((e as Error).message || '生成失败');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [prdText, systemPrompt, modelId, templateKey, generateAttachments]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <Layout className="app-root-layout" style={{ minHeight: '100%', minWidth: 0, overflow: 'hidden' }}>
      <Header className="app-shell app-shell-header" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={1} ellipsis className="app-main-title" style={{ marginBottom: 0 }}>
            Quick PRD Prototype
          </Title>
          <div className="app-main-title-kicker">从 PRD 快速生成可运行的前端交互示例</div>
          <div style={{ marginLeft: 'auto' }}>
            最后更新于 {process.env.NEXT_PUBLIC_BUILD_TIME_BJ ?? '——'}
          </div>
        </div>
      </Header>
      <Content className="app-shell-content" style={{ minWidth: 0, overflow: 'hidden' }}>
        <div ref={containerRef} className="app-main-grid">
          <div
            className="app-panel-left app-shell app-shell-chat"
            style={leftWidthPx != null ? { width: leftWidthPx } : undefined}
          >
            <ChatPanel
              prdText={prdText}
              onPrdText={setPrdText}
              systemPrompt={systemPrompt}
              onSystemPrompt={setSystemPrompt}
              loading={loading}
              onGenerate={onGenerate}
              onStop={onStop}
              templateKey={templateKey}
              onTemplateKey={setTemplateKey}
              modelIds={modelIds}
              modelId={modelId}
              onModelId={setModelId}
              generateAttachments={generateAttachments}
              onGenerateAttachments={setGenerateAttachments}
            />
          </div>
          <div
            className={`app-resize-handle${isDragging ? ' app-resize-handle--active' : ''}`}
            onMouseDown={onResizeStart}
            title="拖动调整宽度"
          >
            <div className="app-resize-handle-icon" />
          </div>
          <div className="app-panel-right">
            <PreviewPanel
              streamingText={streamingText}
              loading={loading}
              fallbackCode={getDefaultCodeForTemplateKey(templateKey)}
              activeTabKey={previewTabKey}
              onTabChange={setPreviewTabKey}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
