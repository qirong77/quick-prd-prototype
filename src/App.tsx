import { Layout, message, Typography } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { ConfigProvider } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import 'antd/dist/antd.css';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { streamAnthropicAssistantText } from './lib/anthropicStream';
import { getAnthropicModelIds, getDefaultAnthropicModelId } from './lib/modelList';
import { getDefaultCodeForTemplate } from './template/defaultCodeRaw';
import { SYSTEM_PROMPT } from './prompts/system';
import { getDefaultPrdText } from './templates';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const modelIds = useMemo(() => getAnthropicModelIds(), []);
  const [modelId, setModelId] = useState(() => getDefaultAnthropicModelId(modelIds));

  const [prdText, setPrdText] = useState(() => getDefaultPrdText());
  const [systemPrompt, setSystemPrompt] = useState(() => SYSTEM_PROMPT);
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
        { prdText, systemPrompt, model: modelId },
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
  }, [prdText, systemPrompt, modelId]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Header
          style={{
            background: '#001529',
            display: 'flex',
            alignItems: 'center',
            paddingInline: 24,
            minWidth: 0,
          }}
        >
          <Title
            level={4}
            ellipsis
            style={{ color: '#fff', margin: 0, flex: 1, minWidth: 0 }}
          >
            Quick PRD 原型（MIS 风格 / antd4）
          </Title>
        </Header>
        <Content style={{ padding: 16, minWidth: 0, overflow: 'hidden' }}>
          <div
            className="app-main-grid"
            style={{
              height: 'calc(100vh - 32px - 64px)',
              minHeight: 520,
            }}
          >
            <ChatPanel
              prdText={prdText}
              onPrdText={setPrdText}
              systemPrompt={systemPrompt}
              onSystemPrompt={setSystemPrompt}
              loading={loading}
              onGenerate={onGenerate}
              onStop={onStop}
              modelIds={modelIds}
              modelId={modelId}
              onModelId={setModelId}
            />
            <PreviewPanel
              streamingText={streamingText}
              loading={loading}
              fallbackCode={getDefaultCodeForTemplate()}
              activeTabKey={previewTabKey}
              onTabChange={setPreviewTabKey}
            />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
