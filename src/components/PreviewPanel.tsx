import { Alert, Button, Card, Space, Spin, Tabs, Typography } from 'antd';
import Editor from '@monaco-editor/react';
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
  /** 无完整生成代码时用于预览/代码 Tab 的模板默认 tsx */
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

  /** 生成结束后代码区展示：优先已提取 tsx，否则完整模型原文，再否则模板 */
  const finalEditorCode = useMemo(() => {
    if (extracted) return extracted;
    const raw = streamingText.trim();
    if (raw.length > 0) return streamingText;
    return fallbackCode.trim();
  }, [extracted, streamingText, fallbackCode]);

  const validationError = useMemo(
    () => (effectiveCode ? validateGeneratedTsx(effectiveCode) : null),
    [effectiveCode],
  );

  const runnerCode = validationError ? '' : effectiveCode ?? '';
  const shouldRun = Boolean(runnerCode.trim());

  const handleDownload = () => {
    if (!finalEditorCode.trim()) return;
    const blob = new Blob([finalEditorCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Prototype.tsx';
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
        <TabPane tab="代码" key="code">
          <div className="preview-code-tab">
            <Space direction="vertical" size="small" style={{ width: '100%', flexShrink: 0 }}>
              <Button type="link" onClick={handleDownload} disabled={loading || !finalEditorCode.trim()}>
                下载 Prototype.tsx
              </Button>
              <Paragraph
                copyable={{ text: loading ? streamingText : finalEditorCode }}
                style={{ marginBottom: 0 }}
              >
                {loading
                  ? streamingText.trim()
                    ? '正在接收流式输出（下方为实时原文）。'
                    : '等待模型输出…'
                  : extracted
                    ? '已提取模型输出的 tsx，可复制或下载。'
                    : finalEditorCode.trim()
                      ? '以下为完整模型输出；若含 ```tsx 代码块将用于预览。'
                      : '尚未获得可展示的 tsx。'}
              </Paragraph>
            </Space>
            <div className="preview-monaco-wrap">
              {loading ? (
                <pre className="preview-streaming-code">{streamingText}</pre>
              ) : (
                <Editor
                  key="monaco-after-stream"
                  height="100%"
                  language="typescript"
                  theme="vs-dark"
                  value={finalEditorCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};
