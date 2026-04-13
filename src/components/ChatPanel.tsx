import { Button, Card, Collapse, Select, Typography } from 'antd';
import React from 'react';
import { getTemplate } from '../templates';
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
    modelIds: string[];
    modelId: string;
    onModelId: (v: string) => void;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
    prdText,
    onPrdText,
    systemPrompt,
    onSystemPrompt,
    loading,
    onGenerate,
    onStop,
    modelIds,
    modelId,
    onModelId,
}) => {
    const currentTemplate = getTemplate();

    return (
        <Card
            className="app-panel-column app-surface-card"
            title="输入"
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
                <Collapse
                    defaultActiveKey={["system", "prd"]}
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
                                    下方为从模板解析的结构范例，可直接在框内修改。
                                </Text>
                            </div>
                        }
                    >
                        <div className="chat-panel-prd-panel-body">
                            <div className="chat-panel-prd-editor-wrap">
                                <PrdMarkdownTextarea
                                    value={prdText}
                                    onChange={onPrdText}
                                    placeholder={currentTemplate.prdPlaceholder}
                                />
                            </div>
                        </div>
                    </Panel>
                </Collapse>
                <div className="chat-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
            </div>
        </Card>
    );
};
