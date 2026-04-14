'use client';

import { Layout, message, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'antd/dist/antd.css';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { streamAnthropicAssistantText } from './lib/anthropicStream';
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
        { prdText, systemPrompt, model: modelId, templateKey },
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
  }, [prdText, systemPrompt, modelId, templateKey]);

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
        </div>
      </Header>
      <Content className="app-shell-content" style={{ minWidth: 0, overflow: 'hidden' }}>
        <div className="app-main-grid">
          <div className="app-shell app-shell-chat">
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
            />
          </div>
          <PreviewPanel
            streamingText={streamingText}
            loading={loading}
            fallbackCode={getDefaultCodeForTemplateKey(templateKey)}
            activeTabKey={previewTabKey}
            onTabChange={setPreviewTabKey}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
