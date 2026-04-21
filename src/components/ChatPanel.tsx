import { MessageOutlined, DeleteOutlined, DownOutlined, PushpinOutlined } from '@ant-design/icons';
import { Card, Collapse, Popconfirm, Space, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import type { ChatSkillDef } from '../lib/chatSkills/types';
import type { ChatSession, SerializedMessage } from '../lib/chatSessions';
import { AiChatPanel } from './AiChatPanel';

const { Text } = Typography;
const { Panel } = Collapse;

export type ChatPanelProps = {
  modelIds: string[];
  modelId: string;
  onModelId: (v: string) => void;
  skills: ChatSkillDef[];
  onSkills: React.Dispatch<React.SetStateAction<ChatSkillDef[]>>;
  sessions: ChatSession[];
  activeSessionId: string;
  onSwitchSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  initialMessages?: SerializedMessage[];
  onAssistantTextChange?: (text: string) => void;
  onMessagesChange?: (messages: SerializedMessage[]) => void;
  onStreamingChange?: (streaming: boolean) => void;
  /** 内置会话自动启用的 skill IDs */
  defaultEnabledSkillIds?: string[];
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  modelIds,
  modelId,
  onModelId,
  skills,
  onSkills,
  sessions,
  activeSessionId,
  onSwitchSession,
  onNewChat,
  onDeleteSession,
  initialMessages,
  onAssistantTextChange,
  onMessagesChange,
  onStreamingChange,
  defaultEnabledSkillIds,
}) => {
  const [collapsed, setCollapsed] = useState<string[]>(['sessions']);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId],
  );

  return (
    <Card
      className="app-panel-column app-surface-card"
      title=""
      size="small"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        padding: 14,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <Collapse
            ghost
            activeKey={collapsed}
            onChange={(keys) => setCollapsed(keys as string[])}
            expandIcon={({ isActive }) => (
              <DownOutlined style={{ fontSize: 10 }} rotate={isActive ? 0 : -90} />
            )}
            style={{ background: 'transparent' }}
          >
            <Panel
              key="sessions"
              header={
                <Text strong style={{ fontSize: 12 }}>
                  聊天记录
                  {activeSession && (
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, fontWeight: 'normal' }}>
                      当前：{activeSession.name}
                    </Text>
                  )}
                </Text>
              }
              style={{ padding: 0 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflow: 'auto' }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: s.id === activeSessionId ? '#e6f4ff' : 'transparent',
                      border: s.id === activeSessionId ? '1px solid #91caff' : '1px solid transparent',
                      fontSize: 12,
                      transition: 'background 0.15s',
                    }}
                    onClick={() => onSwitchSession(s.id)}
                  >
                    {s.builtIn ? (
                      <PushpinOutlined style={{ fontSize: 11, color: '#1677ff', flexShrink: 0 }} />
                    ) : (
                      <MessageOutlined style={{ fontSize: 11, color: '#999', flexShrink: 0 }} />
                    )}
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: s.id === activeSessionId ? 500 : 400,
                    }}>
                      {s.name}
                    </span>
                    <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                      {s.messages.length > 0 ? `${Math.ceil(s.messages.length / 2)} 轮` : '空'}
                    </Text>
                    {!s.builtIn && (
                      <Popconfirm
                        title="删除此聊天？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                      >
                        <Space
                          onClick={(e) => e.stopPropagation()}
                          style={{ flexShrink: 0 }}
                        >
                          <DeleteOutlined style={{ fontSize: 10, color: '#999' }} />
                        </Space>
                      </Popconfirm>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </Collapse>
        </div>

        <AiChatPanel
          key={activeSessionId}
          modelIds={modelIds}
          modelId={modelId}
          onModelId={onModelId}
          skills={skills}
          onSkills={onSkills}
          onNewChat={onNewChat}
          initialMessages={initialMessages}
          onAssistantTextChange={onAssistantTextChange}
          onMessagesChange={onMessagesChange}
          onStreamingChange={onStreamingChange}
          defaultEnabledSkillIds={defaultEnabledSkillIds}
        />
      </div>
    </Card>
  );
};
