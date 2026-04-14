import { useChat } from '@ai-sdk/react';
import { Button, Empty, Input, Select, Typography, message } from 'antd';
import { DefaultChatTransport, isTextUIPart, type UIMessage } from 'ai';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const { Text } = Typography;
const { TextArea } = Input;

export type AiChatPanelProps = {
  modelIds: string[];
  modelId: string;
  onModelId: (v: string) => void;
};

function textFromMessage(m: UIMessage): string {
  return m.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join('');
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ modelIds, modelId, onModelId }) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            messages,
            model: modelId,
          },
        }),
      }),
    [modelId],
  );

  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({
    transport,
    onError: (err) => {
      message.error(err.message || '对话请求失败');
    },
  });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const onSend = useCallback(async () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    clearError();
    await sendMessage({ text: t });
  }, [busy, clearError, draft, sendMessage]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        ref={listRef}
        className="ai-chat-messages"
        style={{
          flex: 1,
          minHeight: 120,
          overflow: 'auto',
          border: '1px solid var(--app-border, #f0f0f0)',
          borderRadius: 8,
          padding: 10,
          background: 'var(--app-chat-bg, #fafafa)',
        }}
      >
        {messages.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="发送一条消息开始对话" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-chat-bubble ai-chat-bubble--${m.role}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: m.role === 'user' ? '#e6f4ff' : '#fff',
                  border: '1px solid #f0f0f0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  {m.role === 'user' ? '你' : '助手'}
                </Text>
                {textFromMessage(m) || (m.role === 'assistant' && busy ? '…' : '')}
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <Text type="danger" style={{ fontSize: 12 }}>
          {error.message}
        </Text>
      ) : null}

      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="输入消息，Enter 发送；Shift+Enter 换行"
        autoSize={{ minRows: 3, maxRows: 8 }}
        disabled={busy}
        onPressEnter={(e) => {
          if (e.shiftKey) return;
          e.preventDefault();
          void onSend();
        }}
      />

      <div className="chat-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Button type="primary" onClick={() => void onSend()} loading={busy} disabled={!draft.trim()}>
          发送
        </Button>
        <Button onClick={() => void stop()} disabled={!busy}>
          停止
        </Button>
        <Button
          onClick={() => {
            setMessages([]);
            clearError();
          }}
          disabled={messages.length === 0 || busy}
        >
          清空
        </Button>
        <Select
          style={{ marginLeft: 'auto', minWidth: 200, maxWidth: 280, flex: '1 1 200px' }}
          value={modelId}
          onChange={onModelId}
          disabled={busy}
          options={modelIds.map((id) => ({ label: id, value: id }))}
          placeholder="选择模型"
          showSearch
          optionFilterProp="label"
        />
      </div>
    </div>
  );
};
