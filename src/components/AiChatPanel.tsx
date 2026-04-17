import { PaperClipOutlined, PlusOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useChat } from '@ai-sdk/react';
import {
  Button,
  Checkbox,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { DefaultChatTransport, isFileUIPart, isTextUIPart, type FileUIPart, type UIMessage } from 'ai';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { CHAT_SKILL_AUTHORING_TEMPLATE } from '../lib/chatSkills/authoringTemplate';
import type { ChatSkillDef } from '../lib/chatSkills/types';
import { loadChatSkills, newChatSkillId, saveChatSkills } from '../lib/chatSkills/storage';
import { ATTACHMENT_INPUT_ACCEPT, filesToFileUIParts, validateClientAttachmentFile } from '../lib/fileAttachmentsClient';

const { Text } = Typography;
const { TextArea } = Input;

export type AiChatPanelProps = {
  modelIds: string[];
  modelId: string;
  onModelId: (v: string) => void;
};

function textFromMessage(m: UIMessage): string {
  const lines: string[] = [];
  for (const p of m.parts) {
    if (isTextUIPart(p) && p.text) lines.push(p.text);
    else if (isFileUIPart(p)) {
      lines.push(`[附件] ${p.filename ?? '未命名'}（${p.mediaType}）`);
    }
  }
  return lines.join('\n');
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ modelIds, modelId, onModelId }) => {
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [skills, setSkills] = useState<ChatSkillDef[]>(() => loadChatSkills());
  /** 本轮对话注入顺序：排在后的 Skill 更靠下合并进 system */
  const [enabledSkillIds, setEnabledSkillIds] = useState<string[]>([]);
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<ChatSkillDef | null>(null);
  const [skillForm] = Form.useForm<{ name: string; description?: string; body: string }>();
  const listRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSkills(loadChatSkills());
  }, []);

  useEffect(() => {
    if (editOpen && editingSkill && !editingSkill.builtIn) {
      skillForm.setFieldsValue({
        name: editingSkill.name,
        description: editingSkill.description,
        body: editingSkill.body,
      });
    } else if (editOpen && !editingSkill) {
      skillForm.resetFields();
    }
  }, [editOpen, editingSkill, skillForm]);

  const enabledSkillsPayload = useMemo(() => {
    return enabledSkillIds
      .map((id) => skills.find((s) => s.id === id))
      .filter((s): s is ChatSkillDef => Boolean(s))
      .map(({ name, description, body }) => ({ name, description, body }));
  }, [enabledSkillIds, skills]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            messages,
            model: modelId,
            ...(enabledSkillsPayload.length > 0 ? { skills: enabledSkillsPayload } : {}),
          },
        }),
      }),
    [enabledSkillsPayload, modelId],
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

  const onPickChatFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!picked.length) return;
    const ok: File[] = [];
    for (const f of picked) {
      const err = validateClientAttachmentFile(f);
      if (err) message.warning(err);
      else ok.push(f);
    }
    if (!ok.length) return;
    try {
      const parts = await filesToFileUIParts(ok);
      setPendingFiles((prev) => [...prev, ...parts]);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '读取附件失败');
    }
  };

  const onSend = useCallback(async () => {
    const t = draft.trim();
    const filesArg = pendingFiles.length ? pendingFiles : undefined;
    if ((!t && !filesArg) || busy) return;
    setDraft('');
    setPendingFiles([]);
    clearError();
    if (t && filesArg) await sendMessage({ text: t, files: filesArg });
    else if (t) await sendMessage({ text: t });
    else if (filesArg) await sendMessage({ files: filesArg });
  }, [busy, clearError, draft, pendingFiles, sendMessage]);

  const toggleSkillEnabled = useCallback((id: string, checked: boolean) => {
    setEnabledSkillIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  }, []);

  const openCreateSkill = useCallback(() => {
    setSkillsPopoverOpen(false);
    setEditingSkill(null);
    setEditOpen(true);
  }, []);

  const openEditSkill = useCallback(
    (s: ChatSkillDef) => {
      setEditingSkill(s);
      setEditOpen(true);
    },
    [],
  );

  const persistSkills = useCallback((next: ChatSkillDef[]) => {
    setSkills(next);
    saveChatSkills(next);
  }, []);

  const onSaveSkill = useCallback(async () => {
    try {
      const v = await skillForm.validateFields();
      const name = v.name.trim();
      const body = v.body.trim();
      if (!name || !body) {
        message.warning('请填写名称与指令正文');
        return;
      }
      if (editingSkill) {
        const next = skills.map((s) =>
          s.id === editingSkill.id
            ? {
                ...s,
                name,
                description: v.description?.trim() || undefined,
                body,
              }
            : s,
        );
        persistSkills(next);
        message.success('已保存');
      } else {
        persistSkills([
          ...skills,
          {
            id: newChatSkillId(),
            name,
            description: v.description?.trim() || undefined,
            body,
          },
        ]);
        message.success('已添加 Skill');
      }
      setEditOpen(false);
    } catch {
      // 表单校验失败
    }
  }, [editingSkill, persistSkills, skillForm, skills]);

  const onDeleteSkill = useCallback(
    (id: string) => {
      Modal.confirm({
        title: '删除该 Skill？',
        content: '删除后不可恢复；若已启用，将从本轮启用列表移除。',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          setSkills((prev) => {
            const next = prev.filter((s) => s.id !== id);
            saveChatSkills(next);
            return next;
          });
          setEnabledSkillIds((prev) => prev.filter((x) => x !== id));
          message.success('已删除');
        },
      });
    },
    [],
  );

  const skillsPopover = (
    <div style={{ maxWidth: 320, maxHeight: 320, overflow: 'auto' }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        勾选要在本轮请求中注入的 Skills
      </Text>
      <Space direction="vertical" style={{ width: '100%' }} size={6}>
        {skills.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Checkbox
              checked={enabledSkillIds.includes(s.id)}
              disabled={busy}
              onChange={(e) => toggleSkillEnabled(s.id, e.target.checked)}
            />
            <div style={{ minWidth: 0 }}>
              <Space size={4}>
                <Text strong style={{ fontSize: 13 }}>
                  {s.name}
                </Text>
                {s.builtIn ? <Tag color="purple" style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>内置</Tag> : null}
              </Space>
              {s.description ? (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {s.description}
                </Text>
              ) : null}
            </div>
          </div>
        ))}
      </Space>
      <Divider style={{ margin: '12px 0' }} />
      <Space wrap>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateSkill}>
          新建 Skill
        </Button>
        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={() => {
            setSkillsPopoverOpen(false);
            setManageOpen(true);
          }}
        >
          管理全部
        </Button>
      </Space>
    </div>
  );

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
            {messages.map((m) => {
              const text = textFromMessage(m);
              return (
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
                    wordBreak: 'break-word',
                    fontSize: 13,
                    lineHeight: 1.55,
                    ...(m.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}),
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    {m.role === 'user' ? '你' : '助手'}
                  </Text>
                  {m.role === 'assistant' ? (
                    text ? (
                      <div className="ai-chat-markdown">
                        <Markdown>{text}</Markdown>
                      </div>
                    ) : busy ? '…' : null
                  ) : (
                    text || null
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error ? (
        <Text type="danger" style={{ fontSize: 12 }}>
          {error.message}
        </Text>
      ) : null}

      <div style={{ flexShrink: 0 }}>
        <Space size={[8, 8]} wrap>
          <input
            ref={chatFileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_INPUT_ACCEPT}
            style={{ display: 'none' }}
            onChange={(ev) => void onPickChatFiles(ev)}
          />
          <Button
            htmlType="button"
            size="small"
            icon={<PaperClipOutlined />}
            disabled={busy}
            onClick={() => chatFileInputRef.current?.click()}
          >
            上传文件
          </Button>
          <Popover
            title="Skills"
            trigger="click"
            open={skillsPopoverOpen}
            onOpenChange={setSkillsPopoverOpen}
            content={skillsPopover}
            placement="topLeft"
          >
            <Button htmlType="button" size="small" icon={<ThunderboltOutlined />} disabled={busy}>
              Skills{enabledSkillIds.length ? `（${enabledSkillIds.length}）` : ''}
            </Button>
          </Popover>
          <Button
            htmlType="button"
            size="small"
            icon={<SettingOutlined />}
            disabled={busy}
            onClick={() => setManageOpen(true)}
          >
            管理 Skills
          </Button>
          {pendingFiles.map((a, i) => (
            <Tag
              key={`${a.filename ?? ''}-${i}-${a.url.slice(0, 24)}`}
              closable={!busy}
              onClose={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
            >
              {a.filename ?? a.mediaType}
            </Tag>
          ))}
        </Space>
      </div>

      {enabledSkillIds.length > 0 ? (
        <div style={{ flexShrink: 0 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
            已启用 Skills（点击 × 仅取消启用，不删除库中条目）
          </Text>
          <Space size={[6, 6]} wrap>
            {enabledSkillIds.map((id) => {
              const s = skills.find((x) => x.id === id);
              if (!s) return null;
              return (
                <Tag
                  key={id}
                  color="geekblue"
                  closable={!busy}
                  onClose={() => toggleSkillEnabled(id, false)}
                >
                  {s.name}
                </Tag>
              );
            })}
          </Space>
        </div>
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
        <Button
          type="primary"
          onClick={() => void onSend()}
          loading={busy}
          disabled={!draft.trim() && pendingFiles.length === 0}
        >
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

      <Modal
        title="管理 Skills"
        open={manageOpen}
        onCancel={() => setManageOpen(false)}
        footer={
          <Button type="primary" onClick={() => setManageOpen(false)}>
            完成
          </Button>
        }
        width={560}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={openCreateSkill}>
            新建 Skill
          </Button>
          {skills.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Space size={6}>
                  <Text strong>{s.name}</Text>
                  {s.builtIn ? <Tag color="purple" style={{ marginInlineEnd: 0 }}>内置</Tag> : null}
                </Space>
                {s.description ? (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {s.description}
                  </Text>
                ) : null}
              </div>
              <Button size="small" onClick={() => openEditSkill(s)}>
                {s.builtIn ? '查看' : '编辑'}
              </Button>
              {!s.builtIn && (
                <Button size="small" danger onClick={() => onDeleteSkill(s.id)}>
                  删除
                </Button>
              )}
            </div>
          ))}
        </Space>
      </Modal>

      <Modal
        title={editingSkill?.builtIn ? '查看内置 Skill' : editingSkill ? '编辑 Skill' : '新建 Skill'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void onSaveSkill()}
        okText="保存"
        cancelText={editingSkill?.builtIn ? '关闭' : '取消'}
        okButtonProps={editingSkill?.builtIn ? { style: { display: 'none' } } : undefined}
        width={640}
      >
        {editingSkill?.builtIn ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>名称</Text>
              <div style={{ marginTop: 4, padding: '6px 10px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, fontSize: 14 }}>
                {editingSkill.name}
              </div>
            </div>
            {editingSkill.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>简短说明</Text>
                <div style={{ marginTop: 4, padding: '6px 10px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, fontSize: 14 }}>
                  {editingSkill.description}
                </div>
              </div>
            )}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>指令正文</Text>
              <div style={{ marginTop: 4, padding: '10px 12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 360, overflow: 'auto' }}>
                {editingSkill.body}
              </div>
            </div>
          </Space>
        ) : (
          <Form form={skillForm} layout="vertical" preserve={false}>
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请填写名称' }]}
            >
              <Input placeholder="例如：PRD 评审助手" maxLength={120} showCount />
            </Form.Item>
            <Form.Item name="description" label="简短说明（可选）">
              <Input placeholder="一句话说明用途，便于在列表中识别" maxLength={200} showCount />
            </Form.Item>
            <Form.Item
              name="body"
              label="指令正文"
              rules={[{ required: true, message: '请填写指令正文' }]}
              extra={
                <Button
                  type="link"
                  size="small"
                  style={{ paddingLeft: 0 }}
                  onClick={() => skillForm.setFieldsValue({ body: CHAT_SKILL_AUTHORING_TEMPLATE })}
                >
                  插入「Skill 编写模板」骨架
                </Button>
              }
            >
              <Input.TextArea
                placeholder="写入要注入模型的完整规则、流程与输出格式…"
                autoSize={{ minRows: 10, maxRows: 22 }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};
