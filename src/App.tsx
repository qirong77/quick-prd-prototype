import { Layout, message, Typography } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { ConfigProvider } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import 'antd/dist/antd.css';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { streamAnthropicAssistantText } from './lib/anthropicStream';
import { getDefaultCodeForTemplate } from './template/defaultCodeRaw';
import { getTemplate } from './templates';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [prdText, setPrdText] = useState(() => getTemplate().prdOutlineExample);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const onGenerate = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setStreamingText('');
    try {
      const full = await streamAnthropicAssistantText(
        { prdText },
        (acc) => setStreamingText(acc),
        ac.signal,
      );
      setStreamingText(full);
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
  }, [prdText]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100%' }}>
        <Header
          style={{
            background: '#001529',
            display: 'flex',
            alignItems: 'center',
            paddingInline: 24,
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Quick PRD 原型（MIS 风格 / antd4）
          </Title>
        </Header>
        <Content style={{ padding: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(360px, min(46vw, 520px)) 1fr',
              gap: 16,
              height: 'calc(100vh - 32px - 64px)',
              minHeight: 520,
            }}
          >
            <ChatPanel
              prdText={prdText}
              onPrdText={setPrdText}
              loading={loading}
              onGenerate={onGenerate}
              onStop={onStop}
            />
            <PreviewPanel
              streamingText={streamingText}
              loading={loading}
              fallbackCode={getDefaultCodeForTemplate()}
            />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
