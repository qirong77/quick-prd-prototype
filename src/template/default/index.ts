/**
 * 默认模板：所有字段均为字符串（含骨架 TSX 源码）。
 */
export const DEFAULT_TEMPLATE = {
  key: 'list_standard',
  label: '标准列表页（搜索 + 表格 + 抽屉）',
  taskGuide: `根据下方【产品描述 / PRD】生成「标准后台列表页」：实现 PRD 中各节的控件与交互；将「一、搜索栏」映射为页顶筛选表单，「二、操作栏」为表格上方按钮区，「三、表格项」为 Table 列与单元格展示，「四、表格操作」为行内或批量操作（查看/编辑等用 Drawer 或 Modal）。若某节在 PRD 中未出现，可省略或极简占位。

以下为与用户输入格式对齐的 PRD 结构范例（实现以用户正文为准）：

# 一、搜索栏
- 订单号：选择框
- 供应商：输入框
- 取车时间：时间选择框

# 二、操作栏
- 新建订单按钮：点击后弹出弹窗，展示新建订单单窗

# 三、表格项
- 订单号：文本
- 供应商：文本
- 取车时间：日期时间
- 订单状态：已完成或者已取消

# 四、表格操作
- 查看：点击后展示侧拉抽屉，抽屉内以只读形式展示该订单的全部字段信息，仅用于查看详情，不可进行修改操作。
- 编辑：点击后同样展示侧拉抽屉，抽屉内展示内容与查看页面一致，所有字段支持编辑修改，抽屉底部设有提交按钮，编辑完成后点击提交可保存修改内容。`,
  prdPlaceholder:
    '建议按范例分节撰写：一、搜索栏 → 二、操作栏 → 三、表格项 → 四、表格操作（含查看/编辑等行为说明）。可参考界面上的结构范例。',
  systemPrompt: '',
  instructions: '',
  code: `import { useState } from 'react';
import {
  Form,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  Drawer,
  Descriptions,
  message,
  Modal,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const mockData = [
  {
    key: '1',
    orderId: 'ORD-2024-001',
    supplier: '神州租车',
    pickupTime: '2024-03-01 10:00',
    status: 'completed',
  },
  {
    key: '2',
    orderId: 'ORD-2024-002',
    supplier: '一嗨租车',
    pickupTime: '2024-03-02 09:00',
    status: 'cancelled',
  },
  {
    key: '3',
    orderId: 'ORD-2024-003',
    supplier: '首汽租车',
    pickupTime: '2024-03-10 14:00',
    status: 'completed',
  },
  {
    key: '4',
    orderId: 'ORD-2024-004',
    supplier: '瑞幸出行',
    pickupTime: '2024-03-15 11:00',
    status: 'cancelled',
  },
  {
    key: '5',
    orderId: 'ORD-2024-005',
    supplier: '神州租车',
    pickupTime: '2024-03-20 08:00',
    status: 'completed',
  },
];

export default function Prototype() {
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();

  const [dataSource, setDataSource] = useState(mockData);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const handleSearch = () => {
    message.info('搜索成功');
  };

  const handleClear = () => {
    searchForm.resetFields();
    setDataSource(mockData);
    message.info('已清空筛选条件');
  };

  const handleView = (record: any) => {
    setCurrentRecord(record);
    setViewDrawerOpen(true);
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    editForm.setFieldsValue({
      orderId: record.orderId,
      supplier: record.supplier,
      pickupTime: record.pickupTime,
      status: record.status,
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      setDataSource((prev) =>
        prev.map((item) =>
          item.key === currentRecord.key ? { ...item, ...values } : item
        )
      );
      message.success('编辑成功');
      setEditDrawerOpen(false);
    });
  };

  const handleCreateOpen = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = () => {
    createForm.validateFields().then((values) => {
      const newRecord = {
        key: String(dataSource.length + 1),
        orderId: values.orderId,
        supplier: values.supplier,
        pickupTime: values.pickupTime,
        status: values.status,
      };
      setDataSource((prev) => [newRecord, ...prev]);
      message.success('新建订单成功');
      setCreateModalOpen(false);
    });
  };

  const statusTagMap: Record<string, { color: string; label: string }> = {
    completed: { color: 'green', label: '已完成' },
    cancelled: { color: 'red', label: '已取消' },
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 140,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
    },
    {
      title: '取车时间',
      dataIndex: 'pickupTime',
      key: 'pickupTime',
      width: 160,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusTagMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <a onClick={() => handleView(record)}>查看</a>
          <a onClick={() => handleEdit(record)}>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 筛选区 */}
      <div
        style={{
          background: '#fff',
          padding: '16px 24px',
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <Form form={searchForm} layout="vertical">
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="订单号" name="orderId">
                <Select placeholder="请选择订单号" allowClear>
                  {mockData.map((item) => (
                    <Option key={item.orderId} value={item.orderId}>
                      {item.orderId}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="供应商" name="supplier">
                <Input placeholder="请输入供应商名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="取车时间" name="pickupTime">
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择取车时间"
                  showTime
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Space>
                <Button type="primary" onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleClear}>清空</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOpen}>
          新建订单
        </Button>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 4, padding: '16px 0' }}>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="key"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => \`共 \${total} 条数据\`,
            pageSize: 10,
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* 查看抽屉 */}
      <Drawer
        title="查看订单详情"
        width={720}
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        destroyOnClose
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">
              {currentRecord.orderId}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {currentRecord.supplier}
            </Descriptions.Item>
            <Descriptions.Item label="取车时间">
              {currentRecord.pickupTime}
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {statusTagMap[currentRecord.status]?.label}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 编辑抽屉 */}
      <Drawer
        title="编辑订单"
        width={720}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSubmit}>
                提交
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="订单号"
            name="orderId"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item
            label="供应商"
            name="supplier"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            label="取车时间"
            name="pickupTime"
            rules={[{ required: true, message: '请输入取车时间' }]}
          >
            <Input placeholder="请输入取车时间" />
          </Form.Item>
          <Form.Item
            label="订单状态"
            name="status"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="请选择订单状态">
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 新建订单弹窗 */}
      <Modal
        title="新建订单"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateSubmit}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="订单号"
            name="orderId"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item
            label="供应商"
            name="supplier"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            label="取车时间"
            name="pickupTime"
            rules={[{ required: true, message: '请输入取车时间' }]}
          >
            <Input placeholder="请输入取车时间" />
          </Form.Item>
          <Form.Item
            label="订单状态"
            name="status"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="请选择订单状态">
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}`,
} as const;
