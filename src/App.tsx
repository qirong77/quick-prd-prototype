'use client';

import { Layout, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'antd/dist/antd.css';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { getAnthropicModelIds, getDefaultAnthropicModelId } from './lib/modelList';
import { getDefaultCodeForTemplateKey } from './template/readDefaultCode';
import type { ChatSkillDef } from './lib/chatSkills/types';
import { loadChatSkills } from './lib/chatSkills/storage';
import {
  type ChatSession,
  type SerializedMessage,
  PAGE_GENERATOR_SKILL_ID,
  createSession,
  getBuiltInSessions,
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
} from './lib/chatSessions';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const modelIds = useMemo(() => getAnthropicModelIds(), []);
  const [modelId, setModelId] = useState(() => getDefaultAnthropicModelId(modelIds));

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

  const [skills, setSkills] = useState<ChatSkillDef[]>(() => loadChatSkills());
  const [assistantText, setAssistantText] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const [previewTabKey, setPreviewTabKey] = useState<'preview' | 'log'>('preview');

  const ssrSafeSessions = useMemo(() => getBuiltInSessions(), []);
  const [sessions, setSessions] = useState<ChatSession[]>(ssrSafeSessions);

  const [activeSessionId, setActiveSessionId] = useState<string>(
    ssrSafeSessions[0]?.id ?? '',
  );

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    const savedId = loadActiveSessionId();
    if (savedId && loaded.some((s) => s.id === savedId)) {
      setActiveSessionId(savedId);
    } else {
      setActiveSessionId(loaded[0]?.id ?? '');
    }
    setHydrated(true);
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  useEffect(() => {
    if (hydrated) saveSessions(sessions);
  }, [hydrated, sessions]);

  useEffect(() => {
    if (hydrated) saveActiveSessionId(activeSessionId);
  }, [hydrated, activeSessionId]);

  const handleNewChat = useCallback(() => {
    const now = new Date();
    const name = `新聊天 ${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const sess = createSession(name);
    setSessions((prev) => {
      const builtIns = prev.filter((s) => s.builtIn);
      const userSessions = prev.filter((s) => !s.builtIn);
      return [...builtIns, sess, ...userSessions];
    });
    setActiveSessionId(sess.id);
    setAssistantText('');
  }, []);

  const handleSwitchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setAssistantText('');
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        setActiveSessionId(next[0]?.id ?? '');
        setAssistantText('');
      }
      return next;
    });
  }, [activeSessionId]);

  const handleMessagesChange = useCallback((msgs: SerializedMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: msgs } : s)),
    );
  }, [activeSessionId]);

  const handleAssistantTextChange = useCallback((text: string) => {
    setAssistantText(text);
  }, []);

  const handleStreamingChange = useCallback((streaming: boolean) => {
    setChatStreaming(streaming);
  }, []);

  useEffect(() => {
    setPreviewTabKey(chatStreaming ? 'log' : 'preview');
  }, [chatStreaming]);

  const handlePreviewTabChange = useCallback((key: string) => {
    if (key === 'preview' || key === 'log') setPreviewTabKey(key);
  }, []);

  const defaultEnabledSkillIds = useMemo(
    () => (activeSession?.builtIn ? [PAGE_GENERATOR_SKILL_ID] : undefined),
    [activeSession],
  );

  const fallbackCode = useMemo(
    () => (activeSession?.templateKey ? getDefaultCodeForTemplateKey(activeSession.templateKey) : ''),
    [activeSession],
  );

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
              modelIds={modelIds}
              modelId={modelId}
              onModelId={setModelId}
              skills={skills}
              onSkills={setSkills}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSwitchSession={handleSwitchSession}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
              initialMessages={activeSession?.messages}
              onAssistantTextChange={handleAssistantTextChange}
              onMessagesChange={handleMessagesChange}
              onStreamingChange={handleStreamingChange}
              defaultEnabledSkillIds={defaultEnabledSkillIds}
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
              streamingText={assistantText}
              loading={chatStreaming}
              fallbackCode={fallbackCode}
              activeTabKey={previewTabKey}
              onTabChange={handlePreviewTabChange}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
