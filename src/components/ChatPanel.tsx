import { Button, Card, Select, Typography } from "antd";
import React from "react";
import { getTemplate } from "../templates";
import { PrdMarkdownTextarea } from "./PrdMarkdownTextarea";

const { Text, Paragraph } = Typography;

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
            className="app-panel-column"
            title="PRD / 对话"
            size="small"
            style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
            bodyStyle={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
                padding: 12,
            }}
        >
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                <Paragraph type="secondary" style={{ marginBottom: 0, flexShrink: 0 }}>
                    本工具适用于本地原型，产物非生产代码。
                </Paragraph>

                <div
                    style={{
                        flex: "0 0 auto",
                        minHeight: 0,
                        maxHeight: "38%",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                    }}
                >
                    <Text strong style={{ flexShrink: 0 }}>
                        系统提示词
                    </Text>
                    <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0, fontSize: 12, flexShrink: 0 }}>
                        控制角色、输出契约与技术栈约束；留空则使用内置默认。
                    </Paragraph>
                    <div className="chat-panel-system-editor-wrap">
                        <PrdMarkdownTextarea
                            value={systemPrompt}
                            onChange={onSystemPrompt}
                            placeholder="系统提示词"
                        />
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        minHeight: 120,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                    }}
                >
                    <Text strong style={{ flexShrink: 0 }}>
                        需求描述
                    </Text>
                    <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0, fontSize: 12, flexShrink: 0 }}>
                        下方为从模板解析的结构范例，可直接在框内修改。
                    </Paragraph>
                    <div className="chat-panel-prd-editor-wrap">
                        <PrdMarkdownTextarea
                            value={prdText}
                            onChange={onPrdText}
                            placeholder={currentTemplate.prdPlaceholder}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Button type="primary" onClick={onGenerate} loading={loading}>
                        生成
                    </Button>
                    <Button onClick={onStop} disabled={!loading}>
                        停止
                    </Button>
                    <Select
                        style={{ marginLeft: "auto",width:220 }}
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
