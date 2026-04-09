import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import { getTemplate } from '../templates';
import { PrdMilkdownEditor } from './PrdMilkdownEditor';

const { Text, Paragraph } = Typography;

export type ChatPanelProps = {
  prdText: string;
  onPrdText: (v: string) => void;
  loading: boolean;
  onGenerate: () => void;
  onStop: () => void;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  prdText,
  onPrdText,
  loading,
  onGenerate,
  onStop,
}) => {
  const currentTemplate = getTemplate();

  return (
    <Card
      className="app-panel-column"
      title="PRD / 对话"
      size="small"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        padding: 12,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 0, flexShrink: 0 }}>
          本工具适用于本地原型，产物非生产代码。
        </Paragraph>

        <div
          style={{
            flex: 1,
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Text strong style={{ flexShrink: 0 }}>
            需求描述
          </Text>
          <Paragraph
            type="secondary"
            style={{ marginTop: 6, marginBottom: 0, fontSize: 12, flexShrink: 0 }}
          >
            下方为结构范例，可直接在框内修改。
          </Paragraph>
          <div className="chat-panel-milkdown-wrap">
            <PrdMilkdownEditor
              value={prdText}
              onChange={onPrdText}
              placeholder={currentTemplate.prdPlaceholder}
            />
          </div>
        </div>

        <Space style={{ flexShrink: 0 }}>
          <Button type="primary" onClick={onGenerate} loading={loading}>
            生成
          </Button>
          <Button onClick={onStop} disabled={!loading}>
            停止
          </Button>
        </Space>
      </div>
    </Card>
  );
};
