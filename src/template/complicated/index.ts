/**
 * 复杂页面模板：包含多条件搜索、Tab 切换、状态流转、多种弹窗/抽屉、批量操作等。
 * 参考真实项目中车辆管理列表页面的交互复杂度。
 */
export const COMPLICATED_TEMPLATE = {
  key: `list_complicated`,
  label: `复杂列表页（Tab + 状态流转 + 多弹窗）`,
  initialMessages: [
    {
      id: 'tpl-comp-user-1',
      role: 'user' as const,
      content: `根据下方【产品描述 / PRD】生成前端页面：

# 一、页面概述
车辆管理列表页，支持多维度搜索筛选、Tab 分类查看、车辆状态流转（上架/下架）、审核流程、详情查看与编辑、批量操作等。

# 二、搜索栏
- 所属门店：下拉选择框，支持搜索
- 车型：级联选择（品牌 > 车系 > 车型）
- 车牌号：输入框
- 车辆状态 / 审核状态：下拉选择
- 即将过期：复选框

# 三、Tab 标签页
- 全部车辆 / 上架中 / 已下架 / 审核中 / 已驳回

# 四、操作栏
- 新增车辆 / 批量导入 / 导出 / 批量删除

# 五、表格操作
- 查看 / 编辑 / 上架或下架 / 删除`,
    },
    {
      id: 'tpl-comp-assistant-1',
      role: 'assistant' as const,
      content: '已根据需求生成复杂列表页原型，包含多条件搜索、Tab 切换、状态流转、多种弹窗/抽屉和批量操作。请在右侧预览面板查看效果。',
    },
  ],
  instructions: `根据下方【产品描述 / PRD】生成前端页面：

以下为与用户输入格式对齐的 PRD 结构范例（实现以用户正文为准）：

# 一、页面概述
车辆管理列表页，支持多维度搜索筛选、Tab 分类查看、车辆状态流转（上架/下架）、审核流程、详情查看与编辑、批量操作等。

# 二、搜索栏
- 所属门店：下拉选择框，支持搜索
- 车型：级联选择（品牌 > 车系 > 车型），支持多选
- 车牌号：输入框
- 车辆状态：下拉选择（全部 / 上架 / 下架）
- 审核状态：下拉选择（全部 / 待提交 / 审核中 / 已通过 / 已驳回）
- 即将过期：复选框（勾选后只展示资质即将过期的车辆）
- 搜索 / 重置按钮

# 三、Tab 标签页
- 全部车辆（显示总数 badge）
- 上架中
- 已下架
- 审核中
- 已驳回
切换 Tab 时自动带上对应筛选条件重新查询。

# 四、操作栏
- 新增车辆按钮：打开新增抽屉
- 批量导入按钮：打开上传弹窗
- 导出按钮：导出当前筛选结果
- 批量删除按钮：选中行后可用，二次确认

# 五、表格列
- 复选框列（用于批量操作）
- 车牌号：文本，附带标签（如"新能源"、"即将过期"用不同颜色 Tag 展示）
- 车龄：文本
- 所属门店：文本
- 品牌 / 车系 / 车型：合并为一列展示
- 审核状态：用不同颜色 Badge 展示（待提交=灰、审核中=蓝、已通过=绿、已驳回=红）
- 车辆状态：上架=绿色、下架=红色
- 提交时间：日期时间
- 最后操作时间：日期时间
- 操作列（fixed right）：查看 / 编辑 / 上架或下架 / 删除

# 六、操作列行为
- 查看：打开右侧详情抽屉（只读），展示车辆全部信息，包含基础信息区和资质信息区
- 编辑：打开右侧编辑抽屉，包含表单，底部有保存和提交审核两个按钮
- 上架/下架：二次确认弹窗，确认后切换状态
- 删除：二次确认弹窗

# 七、新增/编辑抽屉
宽度较大（720px），内含分区表单：
## 基础信息
- 所属门店：下拉选择
- 品牌：下拉选择（选择后联动车系）
- 车系：下拉选择（选择后联动车型）
- 车型：下拉选择
- 车牌号：输入框
- 车辆颜色：输入框
- VIN 码：输入框

## 资质信息
- 行驶证照片：上传组件（可预览）
- 注册日期：日期选择
- 发动机号：输入框

## 保险信息（动态列表，可添加多条）
- 保险类型：下拉选择（交强险 / 商业险）
- 保险公司：输入框
- 生效日期：日期选择
- 到期日期：日期选择
- 第三者责任险保额：数字输入（仅商业险时展示）

底部操作：保存（暂存不提交） / 提交审核 / 取消

# 八、批量导入弹窗
- 上传区域：拖拽或点击上传 Excel 文件
- 下载模板链接
- 上传结果提示（成功数 / 失败数）`,
  skeletonCode: `import { useState, useMemo, useCallback } from 'react';
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
  Badge,
  Drawer,
  Descriptions,
  Tabs,
  Modal,
  Upload,
  InputNumber,
  Divider,
  Popconfirm,
  Checkbox,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  ExportOutlined,
  DeleteOutlined,
  InboxOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { Dragger } = Upload;
const { Text } = Typography;

/* ── mock 数据 ── */
const STORES = ['北京朝阳店', '上海浦东店', '广州天河店', '深圳南山店'];
const BRANDS = ['丰田', '本田', '大众', '宝马', '奔驰'];
const SERIES_MAP: Record<string, string[]> = {
  丰田: ['卡罗拉', '凯美瑞', '雷凌'],
  本田: ['思域', '雅阁', 'CR-V'],
  大众: ['朗逸', '帕萨特', '途观'],
  宝马: ['3系', '5系', 'X3'],
  奔驰: ['C级', 'E级', 'GLC'],
};
const MODELS_MAP: Record<string, string[]> = {
  卡罗拉: ['2024 1.5L 先锋版', '2024 1.8L 双擎豪华版'],
  凯美瑞: ['2024 2.0G 豪华版', '2024 2.5HG 旗舰版'],
  思域: ['2024 240TURBO 燃动版', '2024 e:HEV 混动版'],
  雅阁: ['2024 260TURBO 豪华版', '2024 e:PHEV 混动版'],
  朗逸: ['2024 1.5L 舒适版', '2024 280TSI 豪华版'],
  '3系': ['2024 325Li 豪华版', '2024 330Li xDrive'],
  C级: ['2024 C 200 L 运动版', '2024 C 260 L'],
};

type VehicleRecord = {
  key: string;
  plate: string;
  isNewEnergy: boolean;
  willExpire: boolean;
  vehicleAge: string;
  store: string;
  brand: string;
  series: string;
  model: string;
  auditStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  vehicleStatus: 'online' | 'offline';
  submitTime: string;
  updateTime: string;
  color: string;
  vin: string;
  regDate: string;
  engineNo: string;
  insurances: InsuranceItem[];
};

type InsuranceItem = {
  type: '交强险' | '商业险';
  company: string;
  startDate: string;
  endDate: string;
  thirdPartyLimit?: number;
};

const mockData: VehicleRecord[] = [
  {
    key: '1', plate: '京A·12345', isNewEnergy: false, willExpire: true,
    vehicleAge: '2年3个月', store: '北京朝阳店', brand: '丰田', series: '卡罗拉', model: '2024 1.5L 先锋版',
    auditStatus: 'approved', vehicleStatus: 'online', submitTime: '2024-12-01 10:30',
    updateTime: '2025-01-15 14:20', color: '白色', vin: 'LVGBE40K98G123456',
    regDate: '2022-11-05', engineNo: 'ENG001',
    insurances: [
      { type: '交强险', company: '中国人保', startDate: '2025-01-01', endDate: '2026-01-01' },
      { type: '商业险', company: '平安保险', startDate: '2025-01-01', endDate: '2026-01-01', thirdPartyLimit: 100 },
    ],
  },
  {
    key: '2', plate: '沪B·D67890', isNewEnergy: true, willExpire: false,
    vehicleAge: '1年1个月', store: '上海浦东店', brand: '宝马', series: '3系', model: '2024 325Li 豪华版',
    auditStatus: 'pending', vehicleStatus: 'online', submitTime: '2025-02-10 09:00',
    updateTime: '2025-02-10 09:00', color: '黑色', vin: 'WBAPH5C55BA654321',
    regDate: '2024-01-20', engineNo: 'ENG002',
    insurances: [
      { type: '交强险', company: '太平洋保险', startDate: '2025-02-01', endDate: '2026-02-01' },
    ],
  },
  {
    key: '3', plate: '粤C·88888', isNewEnergy: false, willExpire: false,
    vehicleAge: '3年5个月', store: '广州天河店', brand: '本田', series: '雅阁', model: '2024 260TURBO 豪华版',
    auditStatus: 'rejected', vehicleStatus: 'offline', submitTime: '2024-10-20 16:45',
    updateTime: '2025-03-01 11:30', color: '银色', vin: 'LHGCV165XLE098765',
    regDate: '2021-09-15', engineNo: 'ENG003',
    insurances: [],
  },
  {
    key: '4', plate: '粤B·D11111', isNewEnergy: true, willExpire: true,
    vehicleAge: '6个月', store: '深圳南山店', brand: '大众', series: '朗逸', model: '2024 280TSI 豪华版',
    auditStatus: 'draft', vehicleStatus: 'offline', submitTime: '2025-03-15 08:00',
    updateTime: '2025-03-15 08:00', color: '蓝色', vin: 'LSVAM4187N2345678',
    regDate: '2024-09-01', engineNo: 'ENG004',
    insurances: [
      { type: '交强险', company: '中国人寿', startDate: '2024-09-01', endDate: '2025-09-01' },
      { type: '商业险', company: '中国人保', startDate: '2024-09-01', endDate: '2025-09-01', thirdPartyLimit: 150 },
    ],
  },
  {
    key: '5', plate: '京C·77777', isNewEnergy: false, willExpire: false,
    vehicleAge: '4年', store: '北京朝阳店', brand: '奔驰', series: 'C级', model: '2024 C 200 L 运动版',
    auditStatus: 'approved', vehicleStatus: 'online', submitTime: '2024-08-01 13:00',
    updateTime: '2025-01-20 10:00', color: '灰色', vin: 'WDDWF4KB5JR789012',
    regDate: '2021-03-10', engineNo: 'ENG005',
    insurances: [
      { type: '交强险', company: '平安保险', startDate: '2025-03-01', endDate: '2026-03-01' },
    ],
  },
  {
    key: '6', plate: '沪A·22222', isNewEnergy: false, willExpire: false,
    vehicleAge: '1年8个月', store: '上海浦东店', brand: '丰田', series: '凯美瑞', model: '2024 2.5HG 旗舰版',
    auditStatus: 'approved', vehicleStatus: 'online', submitTime: '2024-06-15 11:20',
    updateTime: '2024-12-30 17:45', color: '红色', vin: 'JTDKN3DU5A0345678',
    regDate: '2023-08-22', engineNo: 'ENG006',
    insurances: [
      { type: '交强险', company: '太平洋保险', startDate: '2024-08-01', endDate: '2025-08-01' },
      { type: '商业险', company: '太平洋保险', startDate: '2024-08-01', endDate: '2025-08-01', thirdPartyLimit: 200 },
    ],
  },
];

const AUDIT_STATUS_MAP: Record<string, { text: string; color: string; status: 'default' | 'processing' | 'success' | 'error' }> = {
  draft:    { text: '待提交', color: '#d9d9d9', status: 'default' },
  pending:  { text: '审核中', color: '#1890ff', status: 'processing' },
  approved: { text: '已通过', color: '#52c41a', status: 'success' },
  rejected: { text: '已驳回', color: '#ff4d4f', status: 'error' },
};

export default function Prototype() {
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [dataSource, setDataSource] = useState<VehicleRecord[]>(mockData);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [onlyExpire, setOnlyExpire] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'add'>('view');
  const [currentRecord, setCurrentRecord] = useState<VehicleRecord | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [editBrand, setEditBrand] = useState<string | undefined>();
  const [editSeries, setEditSeries] = useState<string | undefined>();

  /* ── 筛选逻辑 ── */
  const filteredData = useMemo(() => {
    let list = dataSource;
    if (activeTab === 'online')   list = list.filter((r) => r.vehicleStatus === 'online');
    if (activeTab === 'offline')  list = list.filter((r) => r.vehicleStatus === 'offline');
    if (activeTab === 'pending')  list = list.filter((r) => r.auditStatus === 'pending');
    if (activeTab === 'rejected') list = list.filter((r) => r.auditStatus === 'rejected');
    if (onlyExpire) list = list.filter((r) => r.willExpire);
    return list;
  }, [dataSource, activeTab, onlyExpire]);

  const tabCounts = useMemo(() => ({
    all:      dataSource.length,
    online:   dataSource.filter((r) => r.vehicleStatus === 'online').length,
    offline:  dataSource.filter((r) => r.vehicleStatus === 'offline').length,
    pending:  dataSource.filter((r) => r.auditStatus === 'pending').length,
    rejected: dataSource.filter((r) => r.auditStatus === 'rejected').length,
  }), [dataSource]);

  /* ── 操作 ── */
  const handleSearch = () => message.info('搜索已触发（演示）');
  const handleReset  = () => { searchForm.resetFields(); setOnlyExpire(false); message.info('已重置筛选条件'); };

  const openView = (r: VehicleRecord) => { setCurrentRecord(r); setDrawerMode('view'); setDrawerOpen(true); };
  const openEdit = (r: VehicleRecord) => {
    setCurrentRecord(r);
    setDrawerMode('edit');
    setEditBrand(r.brand);
    setEditSeries(r.series);
    editForm.setFieldsValue({
      store: r.store, brand: r.brand, series: r.series, model: r.model,
      plate: r.plate, color: r.color, vin: r.vin, regDate: moment(r.regDate),
      engineNo: r.engineNo, insurances: r.insurances.map((ins) => ({
        ...ins, startDate: moment(ins.startDate), endDate: moment(ins.endDate),
      })),
    });
    setDrawerOpen(true);
  };
  const openAdd = () => {
    setCurrentRecord(null);
    setDrawerMode('add');
    setEditBrand(undefined);
    setEditSeries(undefined);
    editForm.resetFields();
    setDrawerOpen(true);
  };

  const toggleStatus = (r: VehicleRecord) => {
    const next = r.vehicleStatus === 'online' ? 'offline' : 'online';
    setDataSource((prev) => prev.map((item) =>
      item.key === r.key ? { ...item, vehicleStatus: next, updateTime: moment().format('YYYY-MM-DD HH:mm') } : item,
    ));
    message.success(next === 'online' ? '已上架' : '已下架');
  };

  const handleDelete = (key: string) => {
    setDataSource((prev) => prev.filter((item) => item.key !== key));
    setSelectedRowKeys((prev) => prev.filter((k) => k !== key));
    message.success('已删除');
  };

  const handleBatchDelete = () => {
    setDataSource((prev) => prev.filter((item) => !selectedRowKeys.includes(item.key)));
    setSelectedRowKeys([]);
    message.success(\`已删除 \${selectedRowKeys.length} 条记录\`);
  };

  const handleSave = () => {
    editForm.validateFields().then(() => {
      message.success(drawerMode === 'add' ? '已保存草稿' : '已保存修改');
      setDrawerOpen(false);
    });
  };

  const handleSubmitAudit = () => {
    editForm.validateFields().then(() => {
      message.success('已提交审核');
      setDrawerOpen(false);
    });
  };

  /* ── 表格列 ── */
  const columns = [
    {
      title: '车牌号', dataIndex: 'plate', key: 'plate', width: 170, fixed: 'left' as const,
      render: (plate: string, r: VehicleRecord) => (
        <Space direction="vertical" size={2}>
          <Text strong>{plate}</Text>
          <Space size={4}>
            {r.isNewEnergy && <Tag color="green">新能源</Tag>}
            {r.willExpire && <Tag color="orange">即将过期</Tag>}
          </Space>
        </Space>
      ),
    },
    { title: '车龄', dataIndex: 'vehicleAge', key: 'vehicleAge', width: 100 },
    { title: '所属门店', dataIndex: 'store', key: 'store', width: 130 },
    {
      title: '品牌 / 车系 / 车型', key: 'brandInfo', width: 260,
      render: (_: unknown, r: VehicleRecord) => \`\${r.brand} / \${r.series} / \${r.model}\`,
    },
    {
      title: '审核状态', dataIndex: 'auditStatus', key: 'auditStatus', width: 100,
      render: (s: string) => {
        const info = AUDIT_STATUS_MAP[s];
        return <Badge status={info?.status ?? 'default'} text={info?.text ?? s} />;
      },
    },
    {
      title: '车辆状态', dataIndex: 'vehicleStatus', key: 'vehicleStatus', width: 90,
      render: (s: string) => <Tag color={s === 'online' ? 'green' : 'red'}>{s === 'online' ? '上架' : '下架'}</Tag>,
    },
    { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 160 },
    { title: '最后操作', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: unknown, r: VehicleRecord) => (
        <Space size="small" wrap>
          <a onClick={() => openView(r)}>查看</a>
          {r.auditStatus !== 'pending' && <a onClick={() => openEdit(r)}>编辑</a>}
          {r.auditStatus === 'approved' && (
            <Popconfirm
              title={\`确认\${r.vehicleStatus === 'online' ? '下架' : '上架'}该车辆？\`}
              onConfirm={() => toggleStatus(r)}
            >
              <a>{r.vehicleStatus === 'online' ? '下架' : '上架'}</a>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除该车辆？删除后不可恢复。" onConfirm={() => handleDelete(r.key)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── 渲染 ── */
  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 搜索区 */}
      <div style={{ background: '#fff', padding: '16px 24px 8px', borderRadius: 4, marginBottom: 16 }}>
        <Form form={searchForm} layout="vertical">
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item label="所属门店" name="store">
                <Select placeholder="请选择门店" allowClear showSearch optionFilterProp="children">
                  {STORES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="品牌" name="brand">
                <Select placeholder="请选择品牌" allowClear>
                  {BRANDS.map((b) => <Option key={b} value={b}>{b}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="车牌号" name="plate">
                <Input placeholder="请输入车牌号" allowClear />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="车辆状态" name="vehicleStatus">
                <Select placeholder="全部" allowClear>
                  <Option value="online">上架</Option>
                  <Option value="offline">下架</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="审核状态" name="auditStatus">
                <Select placeholder="全部" allowClear>
                  <Option value="draft">待提交</Option>
                  <Option value="pending">审核中</Option>
                  <Option value="approved">已通过</Option>
                  <Option value="rejected">已驳回</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Checkbox checked={onlyExpire} onChange={(e) => setOnlyExpire(e.target.checked)}>
                  即将过期
                </Checkbox>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" onClick={handleSearch}>搜索</Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Tab + 操作栏 + 表格 */}
      <div style={{ background: '#fff', borderRadius: 4, padding: '0 24px 16px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => { setActiveTab(k); setSelectedRowKeys([]); }}
          tabBarExtraContent={
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增车辆</Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>批量导入</Button>
              <Button icon={<ExportOutlined />} onClick={() => message.info('导出功能（演示）')}>导出</Button>
              <Popconfirm
                title={\`确认删除选中的 \${selectedRowKeys.length} 条记录？\`}
                onConfirm={handleBatchDelete}
                disabled={selectedRowKeys.length === 0}
              >
                <Button danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
                  批量删除{selectedRowKeys.length > 0 ? \`（\${selectedRowKeys.length}）\` : ''}
                </Button>
              </Popconfirm>
            </Space>
          }
          items={[
            { key: 'all',      label: \`全部（\${tabCounts.all}）\` },
            { key: 'online',   label: \`上架中（\${tabCounts.online}）\` },
            { key: 'offline',  label: \`已下架（\${tabCounts.offline}）\` },
            { key: 'pending',  label: \`审核中（\${tabCounts.pending}）\` },
            { key: 'rejected', label: \`已驳回（\${tabCounts.rejected}）\` },
          ]}
        />
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          scroll={{ x: 1500 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => \`共 \${total} 条\`,
            pageSize: 10,
          }}
        />
      </div>

      {/* 查看 / 编辑 / 新增 抽屉 */}
      <Drawer
        title={drawerMode === 'view' ? '车辆详情' : drawerMode === 'edit' ? '编辑车辆' : '新增车辆'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          drawerMode !== 'view' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
              <Button type="primary" onClick={handleSubmitAudit}>提交审核</Button>
            </div>
          ) : null
        }
      >
        {drawerMode === 'view' && currentRecord ? (
          <>
            <Divider orientation="left">基础信息</Divider>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="车牌号">{currentRecord.plate}</Descriptions.Item>
              <Descriptions.Item label="所属门店">{currentRecord.store}</Descriptions.Item>
              <Descriptions.Item label="品牌 / 车系 / 车型" span={2}>
                {currentRecord.brand} / {currentRecord.series} / {currentRecord.model}
              </Descriptions.Item>
              <Descriptions.Item label="颜色">{currentRecord.color}</Descriptions.Item>
              <Descriptions.Item label="VIN 码">{currentRecord.vin}</Descriptions.Item>
              <Descriptions.Item label="车龄">{currentRecord.vehicleAge}</Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Badge status={AUDIT_STATUS_MAP[currentRecord.auditStatus]?.status} text={AUDIT_STATUS_MAP[currentRecord.auditStatus]?.text} />
              </Descriptions.Item>
              <Descriptions.Item label="车辆状态">
                <Tag color={currentRecord.vehicleStatus === 'online' ? 'green' : 'red'}>
                  {currentRecord.vehicleStatus === 'online' ? '上架' : '下架'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">资质信息</Divider>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="注册日期">{currentRecord.regDate}</Descriptions.Item>
              <Descriptions.Item label="发动机号">{currentRecord.engineNo}</Descriptions.Item>
            </Descriptions>
            {currentRecord.insurances.length > 0 && (
              <>
                <Divider orientation="left">保险信息</Divider>
                {currentRecord.insurances.map((ins, idx) => (
                  <Descriptions key={idx} column={2} bordered size="small" style={{ marginBottom: 12 }}>
                    <Descriptions.Item label="保险类型">{ins.type}</Descriptions.Item>
                    <Descriptions.Item label="保险公司">{ins.company}</Descriptions.Item>
                    <Descriptions.Item label="生效日期">{ins.startDate}</Descriptions.Item>
                    <Descriptions.Item label="到期日期">{ins.endDate}</Descriptions.Item>
                    {ins.type === '商业险' && (
                      <Descriptions.Item label="三者险保额" span={2}>{ins.thirdPartyLimit} 万元</Descriptions.Item>
                    )}
                  </Descriptions>
                ))}
              </>
            )}
          </>
        ) : drawerMode !== 'view' ? (
          <Form form={editForm} layout="vertical" preserve={false}>
            <Divider orientation="left">基础信息</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="store" label="所属门店" rules={[{ required: true, message: '请选择门店' }]}>
                  <Select placeholder="请选择门店">
                    {STORES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="plate" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                  <Input placeholder="请输入车牌号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="brand" label="品牌" rules={[{ required: true, message: '请选择品牌' }]}>
                  <Select
                    placeholder="请选择品牌"
                    onChange={(v) => { setEditBrand(v); setEditSeries(undefined); editForm.setFieldsValue({ series: undefined, model: undefined }); }}
                  >
                    {BRANDS.map((b) => <Option key={b} value={b}>{b}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="series" label="车系" rules={[{ required: true, message: '请选择车系' }]}>
                  <Select
                    placeholder="请选择车系"
                    disabled={!editBrand}
                    onChange={(v) => { setEditSeries(v); editForm.setFieldsValue({ model: undefined }); }}
                  >
                    {(SERIES_MAP[editBrand ?? ''] ?? []).map((s) => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="model" label="车型" rules={[{ required: true, message: '请选择车型' }]}>
                  <Select placeholder="请选择车型" disabled={!editSeries}>
                    {(MODELS_MAP[editSeries ?? ''] ?? []).map((m) => <Option key={m} value={m}>{m}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="color" label="颜色"><Input placeholder="请输入车辆颜色" /></Form.Item></Col>
              <Col span={16}><Form.Item name="vin" label="VIN 码"><Input placeholder="请输入 VIN 码" /></Form.Item></Col>
            </Row>

            <Divider orientation="left">资质信息</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="regDate" label="注册日期">
                  <DatePicker style={{ width: '100%' }} placeholder="请选择注册日期" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="engineNo" label="发动机号">
                  <Input placeholder="请输入发动机号" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">保险信息</Divider>
            <Form.List name="insurances">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <div key={key} style={{ background: '#fafafa', padding: '12px 16px', borderRadius: 6, marginBottom: 12, position: 'relative' }}>
                      <MinusCircleOutlined
                        style={{ position: 'absolute', top: 12, right: 12, fontSize: 16, color: '#ff4d4f', cursor: 'pointer' }}
                        onClick={() => remove(name)}
                      />
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item {...rest} name={[name, 'type']} label="保险类型" rules={[{ required: true, message: '请选择' }]}>
                            <Select placeholder="请选择">
                              <Option value="交强险">交强险</Option>
                              <Option value="商业险">商业险</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...rest} name={[name, 'company']} label="保险公司" rules={[{ required: true, message: '请输入' }]}>
                            <Input placeholder="请输入保险公司" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item noStyle shouldUpdate={(prev, cur) => prev?.insurances?.[name]?.type !== cur?.insurances?.[name]?.type}>
                            {({ getFieldValue }) =>
                              getFieldValue(['insurances', name, 'type']) === '商业险' ? (
                                <Form.Item {...rest} name={[name, 'thirdPartyLimit']} label="三者险保额（万）">
                                  <InputNumber min={0} style={{ width: '100%' }} placeholder="如 100" />
                                </Form.Item>
                              ) : <div />
                            }
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item {...rest} name={[name, 'startDate']} label="生效日期" rules={[{ required: true, message: '请选择' }]}>
                            <DatePicker style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...rest} name={[name, 'endDate']} label="到期日期" rules={[{ required: true, message: '请选择' }]}>
                            <DatePicker style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加保险信息</Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        ) : null}
      </Drawer>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入车辆"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={() => { message.success('导入成功（演示）'); setImportModalOpen(false); }}>确认导入</Button>,
        ]}
        width={520}
      >
        <div style={{ marginBottom: 16 }}>
          <a onClick={() => message.info('下载模板（演示）')}>下载导入模板</a>
        </div>
        <Dragger
          accept=".xlsx,.xls,.csv"
          maxCount={1}
          beforeUpload={() => false}
          style={{ padding: '20px 0' }}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 .xlsx / .xls / .csv 格式，单次最多导入 500 条</p>
        </Dragger>
      </Modal>
    </div>
  );
}`,
} as const;
