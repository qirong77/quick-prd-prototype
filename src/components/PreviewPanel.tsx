import { Alert, Button, Card, Space, Spin, Tabs, Typography } from 'antd';
import React, { useMemo } from 'react';
import { useRunner } from 'react-runner';
import { tryExtractModelTsx } from '../lib/extractTsxBlock';
import { buildRunnerScope } from '../lib/runnerScope';
import { validateGeneratedTsx } from '../lib/validateGeneratedTsx';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';

const { Paragraph } = Typography;
const { TabPane } = Tabs;

type RunnerPreviewProps = {
  code: string;
  scope: Record<string, unknown>;
};

/** 独立子组件 + key，避免 react-runner 在源码字符串变化后仍保留旧组件实例 */
const RunnerPreview: React.FC<RunnerPreviewProps> = ({ code, scope }) => {
  const shouldRun = Boolean(code.trim());
  const runnerCode = shouldRun
    ? code
    : 'export default function __Empty(){ return null; }';
  const { element, error } = useRunner({ code: runnerCode, scope });

  return (
    <>
      {shouldRun ? (
        <PreviewErrorBoundary>
          <div
            style={{
              padding: 16,
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            {element}
          </div>
        </PreviewErrorBoundary>
      ) : null}
      {shouldRun && error ? (
        <Alert
          type="error"
          showIcon
          message="编译/运行失败"
          description={
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12 }}>
              {String(error)}
            </pre>
          }
          style={{ marginTop: 12 }}
        />
      ) : null}
    </>
  );
};

export type PreviewPanelProps = {
  streamingText: string;
  loading: boolean;
  /** 无完整生成代码时用于预览的模板默认 tsx */
  fallbackCode?: string;
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  streamingText,
  loading,
  fallbackCode = '',
  activeTabKey,
  onTabChange,
}) => {
  const scope = useMemo(() => buildRunnerScope(), []);

  const extracted = useMemo(
    () => tryExtractModelTsx(streamingText),
    [streamingText],
  );

  const effectiveCode = useMemo(() => {
    if (extracted) return extracted;
    if (loading && streamingText.trim().length > 0) return null;
    const fb = fallbackCode.trim();
    return fb.length > 0 ? fb : null;
  }, [extracted, loading, streamingText, fallbackCode]);

  const validationError = useMemo(
    () => (effectiveCode ? validateGeneratedTsx(effectiveCode) : null),
    [effectiveCode],
  );

  const runnerCode = validationError ? '' : effectiveCode ?? '';
  const shouldRun = Boolean(runnerCode.trim());

  const handleDownloadLog = () => {
    if (!streamingText.trim()) return;
    const blob = new Blob([streamingText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model-response.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      className="app-panel-column"
      title="生成结果"
      size="small"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <Tabs
        className="preview-panel-tabs"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        activeKey={activeTabKey}
        onChange={onTabChange}
      >
        <TabPane tab="预览" key="preview">
          <div className="preview-tab-preview-root">
            <Spin
              spinning={loading}
              size="large"
              tip="正在生成，请稍候…"
              wrapperClassName="preview-spin-fill"
            >
              <div className="preview-tab-scroll-inner">
                {validationError ? (
                  <Alert type="warning" showIcon message={validationError} style={{ marginBottom: 12 }} />
                ) : null}
                {shouldRun ? (
                  <RunnerPreview key={runnerCode} code={runnerCode} scope={scope} />
                ) : null}
              </div>
            </Spin>
          </div>
        </TabPane>
        <TabPane tab="日志" key="log">
          <div className="preview-log-tab">
            <Space direction="vertical" size="small" style={{ width: '100%', flexShrink: 0 }}>
              <Space wrap>
                <Button type="link" onClick={handleDownloadLog} disabled={!streamingText.trim()}>
                  下载完整响应
                </Button>
              </Space>
              <Paragraph copyable={{ text: streamingText }} style={{ marginBottom: 0 }}>
                {loading
                  ? streamingText.trim()
                    ? '流式接收中，下方为当前已累积的完整原文。'
                    : '等待模型输出…'
                  : streamingText.trim()
                    ? '以下为本次请求返回的完整原文（含思考过程）；预览中的 tsx 仍从 ```tsx 提取。'
                    : '尚无模型返回内容。'}
              </Paragraph>
            </Space>
            <pre className="preview-log-body">{streamingText}</pre>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};
