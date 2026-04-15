import { PaperClipOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, message, Radio, Select, Space, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { ATTACHMENT_INPUT_ACCEPT, filesToFileUIParts, validateClientAttachmentFile } from '../lib/fileAttachmentsClient';
import type { StreamAttachment } from '../lib/anthropicStream';
import { TEMPLATES } from '../template';
import { AiChatPanel } from './AiChatPanel';
import { PrdMarkdownTextarea } from './PrdMarkdownTextarea';

const { Text } = Typography;
const { Panel } = Collapse;

export type ChatPanelProps = {
    prdText: string;
    onPrdText: (v: string) => void;
    systemPrompt: string;
    onSystemPrompt: (v: string) => void;
    loading: boolean;
    onGenerate: () => void;
    onStop: () => void;
    templateKey: string;
    onTemplateKey: (v: string) => void;
    modelIds: string[];
    modelId: string;
    onModelId: (v: string) => void;
    generateAttachments: StreamAttachment[];
    onGenerateAttachments: React.Dispatch<React.SetStateAction<StreamAttachment[]>>;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
    prdText,
    onPrdText,
    systemPrompt,
    onSystemPrompt,
    loading,
    onGenerate,
    onStop,
    templateKey,
    onTemplateKey,
    modelIds,
    modelId,
    onModelId,
    generateAttachments,
    onGenerateAttachments,
}) => {
    const [sidebarMode, setSidebarMode] = useState<'generate' | 'chat'>('generate');
    const generateFileInputRef = useRef<HTMLInputElement>(null);

    const onPickGenerateFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // 必须先拷贝 File[]：清空 value 后，同一 FileList 引用会被浏览器置空。
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
            onGenerateAttachments((prev) => [...prev, ...parts]);
        } catch (err) {
            message.error(err instanceof Error ? err.message : '读取附件失败');
        }
    };

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
                    gap: 14,
                }}
            >
                <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        模式
                    </Text>
                    <Radio.Group
                        buttonStyle="solid"
                        value={sidebarMode}
                        onChange={(e) => setSidebarMode(e.target.value as 'generate' | 'chat')}
                        style={{ width: '100%', display: 'flex' }}
                    >
                        <Radio.Button value="generate" style={{ flex: 1, textAlign: 'center' }}>
                            页面生成
                        </Radio.Button>
                        <Radio.Button value="chat" style={{ flex: 1, textAlign: 'center' }}>
                            聊天
                        </Radio.Button>
                    </Radio.Group>
                </div>

                {sidebarMode === 'generate' ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                模板
                            </Text>
                            <Select
                                style={{ width: '100%' }}
                                value={templateKey}
                                onChange={onTemplateKey}
                                disabled={loading}
                                options={TEMPLATES.map((t) => ({ label: t.label, value: t.key }))}
                                placeholder="选择模板"
                                showSearch
                                optionFilterProp="label"
                            />
                        </div>
                        <div style={{ flexShrink: 0 }}>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                参考附件（可选）
                            </Text>
                            <Space size={[8, 8]} wrap style={{ width: '100%' }}>
                                <input
                                    ref={generateFileInputRef}
                                    type="file"
                                    multiple
                                    accept={ATTACHMENT_INPUT_ACCEPT}
                                    style={{ display: 'none' }}
                                    onChange={(ev) => void onPickGenerateFiles(ev)}
                                />
                                <Button
                                    htmlType="button"
                                    size='small'
                                    icon={<PaperClipOutlined />}
                                    disabled={loading}
                                    onClick={() => generateFileInputRef.current?.click()}
                                >
                                    上传文件
                                </Button>
                                {generateAttachments.map((a, i) => (
                                    <Tag
                                        key={`${a.filename ?? ''}-${i}-${a.url.slice(0, 24)}`}
                                        closable={!loading}
                                        onClose={() =>
                                            onGenerateAttachments((prev) => prev.filter((_, j) => j !== i))
                                        }
                                    >
                                        {a.filename ?? a.mediaType}
                                    </Tag>
                                ))}
                            </Space>
                        </div>
                        <Collapse
                            defaultActiveKey={['prd']}
                            className="chat-panel-collapse"
                            expandIconPosition="end"
                        >
                            <Panel
                                key="system"
                                className="chat-panel-collapse-panel-system"
                                header={
                                    <div className="chat-panel-collapse-header-inner">
                                        <Text strong>系统提示词</Text>
                                        <Text type="secondary" className="chat-panel-collapse-header-desc">
                                            控制角色、输出契约与技术栈约束；留空则使用内置默认。
                                        </Text>
                                    </div>
                                }
                            >
                                <div className="chat-panel-system-panel-body">
                                    <div className="chat-panel-system-editor-wrap chat-panel-system-editor-wrap--autosize">
                                        <PrdMarkdownTextarea
                                            value={systemPrompt}
                                            onChange={onSystemPrompt}
                                            placeholder="系统提示词"
                                            autoSize={{ minRows: 5, maxRows: 16 }}
                                        />
                                    </div>
                                </div>
                            </Panel>
                            <Panel
                                key="prd"
                                className="chat-panel-collapse-panel-prd"
                                header={
                                    <div className="chat-panel-collapse-header-inner">
                                        <Text strong>需求描述</Text>
                                        <Text type="secondary" className="chat-panel-collapse-header-desc">
                                            与当前模板的 instructions 一致，可直接在框内修改。
                                        </Text>
                                    </div>
                                }
                            >
                                <div className="chat-panel-prd-panel-body">
                                    <div className="chat-panel-prd-editor-wrap">
                                        <PrdMarkdownTextarea
                                            value={prdText}
                                            onChange={onPrdText}
                                            placeholder="需求描述 / PRD"
                                        />
                                    </div>
                                </div>
                            </Panel>
                        </Collapse>
                        <div
                            className="chat-panel-actions"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                        >
                            <Button type="primary" onClick={onGenerate} loading={loading}>
                                生成
                            </Button>
                            <Button onClick={onStop} disabled={!loading}>
                                停止
                            </Button>
                            <Select
                                style={{ marginLeft: 'auto', minWidth: 200, maxWidth: 280, flex: '1 1 200px' }}
                                value={modelId}
                                onChange={onModelId}
                                disabled={loading}
                                options={modelIds.map((id) => ({ label: id, value: id }))}
                                placeholder="选择模型"
                                showSearch
                                optionFilterProp="label"
                            />
                        </div>
                    </>
                ) : (
                    <AiChatPanel modelIds={modelIds} modelId={modelId} onModelId={onModelId} />
                )}
            </div>
        </Card>
    );
};
