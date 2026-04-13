import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Switch,
  Modal,
  Form,
  Input,
  InputNumber,
  Spin,
  message,
  Divider,
  Tabs,
  Upload,
  Select,
} from 'antd';
import { LogoutOutlined, UserOutlined, DollarOutlined, UploadOutlined } from '@ant-design/icons';
import {
  adminApi,
  JobSummary,
  UserSummary,
  TransactionsResponse,
  MetricsResponse,
  JobsResponse,
} from './api/admin';

const { Content, Footer } = Layout;
const { Title } = Typography;

type LoginPayload = {
  email: string;
  password: string;
};

const LoginForm: React.FC<{ onLogin: (data: LoginPayload) => Promise<void>; error?: string }> = ({
  onLogin,
  error,
}) => {
  const [form] = Form.useForm<LoginPayload>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginPayload) => {
    setLoading(true);
    try {
      await onLogin(values);
    } catch (err) {
      message.error('Не удалось войти. Проверьте логин/пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Col span={24} md={12} lg={8} className="mx-auto">
      <Card>
        <Title level={3} className="text-center">
          Админка NanoVisual
        </Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Введите email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@nanovi.ru" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          {error && (
            <Typography.Text type="danger" className="block mb-2">
              {error}
            </Typography.Text>
          )}
          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Col>
  );
};

const AdminStats: React.FC<{ metrics: MetricsResponse | null }> = ({ metrics }) => {
  if (!metrics) {
    return <Spin />;
  }
  const { api_errors, failure_rate, backlog, webhooks } = metrics;
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic
            title="API ошибки"
            value={api_errors}
            prefix={<DollarOutlined />}
            precision={0}
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Уровень отказов" value={failure_rate} precision={2} suffix="%" />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Всего статусов очереди" value={Object.keys(backlog).length} />
          <div className="mt-2 text-sm">
            {Object.entries(backlog).map(([key, value]) => (
              <div key={key}>
                {key}: <strong>{value}</strong>
              </div>
            ))}
            {Object.keys(webhooks).length > 0 && (
              <>
                <Divider className="my-2" />
                <div>Webhooks:</div>
                {Object.entries(webhooks).map(([key, value]) => (
                  <div key={key}>
                    {key}: <strong>{value}</strong>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

const UsersSection: React.FC<{
  users: UserSummary[];
  loading: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onAdjust: (user: UserSummary) => void;
  onToggle: (user: UserSummary) => void;
}> = ({ users, loading, page, total, onPageChange, onAdjust, onToggle, onRefresh }) => {
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      sorter: true,
    },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      key: 'active',
      render: (_: boolean, record: UserSummary) => (
        <Switch checked={record.is_active} onChange={() => onToggle(record)} />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: UserSummary) => (
        <Button type="link" onClick={() => onAdjust(record)}>
          Скорректировать баланс
        </Button>
      ),
    },
  ];
  return (
    <Card
      title="Пользователи"
      extra={
        <Button type="link" onClick={onRefresh}>
          Обновить
        </Button>
      }
    >
      <Table
        rowKey="user_id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          showSizeChanger: false,
          onChange: onPageChange,
        }}
      />
    </Card>
  );
};

const TransactionsSection: React.FC<{
  data: TransactionsResponse | null;
  loading: boolean;
  onRefresh: () => void;
}> = ({ data, loading, onRefresh }) => {
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Сумма',
      dataIndex: 'delta',
      key: 'delta',
      render: (value: number) => `${value} NV`,
    },
    {
      title: 'Валюта',
      dataIndex: 'amount_rub',
      key: 'amount',
      render: (value: number | null) => (value ? `${value} ₽` : '-'),
    },
    {
      title: 'Тип',
      dataIndex: 'kind',
      key: 'kind',
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <Card
      title="Транзакции"
      extra={
        <Button type="link" onClick={onRefresh}>
          Обновить
        </Button>
      }
    >
      <Table
        rowKey="transaction_id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
};

const AdjustModal: React.FC<{
  user: UserSummary | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (user: UserSummary, amount: number, comment?: string) => void;
}> = ({ user, open, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (user) {
          onSubmit(user, values.amount, values.comment);
        }
      })
      .finally(() => form.resetFields());
  };

  return (
    <Modal
      title={`Корректировка баланса ${user?.email ?? ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Сумма (NV)"
          name="amount"
          rules={[{ required: true, message: 'Введите сумму' }]}
        >
          <InputNumber className="w-full" min={-1_000_000} max={1_000_000} />
        </Form.Item>
        <Form.Item label="Комментарий" name="comment">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const GallerySection: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const[stylesList, setStylesList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const load = () => {
    adminApi.fetchGallery().then(r => setItems(r.items)).catch(console.error);
    adminApi.fetchCategories().then(res => setStylesList(res)).catch(console.error);
  };
  useEffect(() => { load(); },[]);

  const handleUpload = async (options: any) => {
    try {
      const res = await adminApi.uploadGalleryImage(options.file);
      options.onSuccess(res, options.file);
    } catch (err) {
      options.onError(err);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleAdd = async (vals: any) => {
    setUploading(true);
    try {
      // Достаем URL исходного фото, если оно загружено
      const inputUrl = vals.input_image_upload?.[0]?.response?.file_name
        ? `/media/${vals.input_image_upload[0].response.file_name}`
        : null;

      // Достаем URL результирующих фото
      const resultUrls = (vals.result_images_upload ||[])
        .map((f: any) => f.response?.file_name ? `/media/${f.response.file_name}` : null)
        .filter(Boolean);

      if (resultUrls.length === 0) {
        message.error('Загрузите хотя бы одно фото-результат!');
        setUploading(false);
        return;
      }

      const payload = {
        prompt: vals.prompt,
        style_ids: vals.style_ids ||[],
        result_images: resultUrls,
        input_image: inputUrl
      };

      await adminApi.createGalleryItem(payload);
      setOpen(false);
      form.resetFields();
      load();
      message.success('Пример добавлен');
    } catch (err) {
      message.error('Ошибка добавления');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить?')) {
      await adminApi.deleteGalleryItem(id);
      load();
    }
  };

  return (
    <Card title="Галерея промптов" extra={<Button onClick={() => setOpen(true)}>Добавить пример</Button>}>
      <Table 
        rowKey="id" dataSource={items} 
        columns={[
          { title: 'Промпт', dataIndex: 'prompt', width: '50%' },
          { title: 'Картинки', dataIndex: 'result_images', render: (imgs: string[]) => `${imgs.length} шт.` },
          { title: 'Действия', render: (_, r) => <Button danger onClick={() => handleDelete(r.id)}>Удалить</Button> }
        ]} 
      />
      <Modal 
        title="Новый пример для галереи" 
        open={open} 
        onCancel={() => setOpen(false)} 
        onOk={() => form.submit()} 
        width={700}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="prompt" label="Промпт (описание, которое увидит пользователь)" rules={[{ required: true, message: 'Введите промпт' }]}>
            <Input.TextArea rows={3} placeholder="Пример: Студийная съемка, макро..." />
          </Form.Item>

          <div className="p-4 border rounded-xl bg-slate-50 mb-6">
            <Form.Item 
              name="input_image_upload" 
              label={<b>1. Исходное фото (Опционально. То, что загрузил пользователь)</b>} 
              valuePropName="fileList" 
              getValueFromEvent={normFile}
            >
              <Upload customRequest={handleUpload} listType="picture" maxCount={1}>
                <Button icon={<UploadOutlined />}>Загрузить исходник</Button>
              </Upload>
            </Form.Item>

            <Form.Item 
              name="result_images_upload" 
              label={<b>2. Результат генерации (Обязательно. То, что выдала нейронка)</b>} 
              valuePropName="fileList" 
              getValueFromEvent={normFile} 
              rules={[{ required: true, message: 'Загрузите хотя бы одно фото' }]}
              className="mb-0"
            >
              <Upload customRequest={handleUpload} listType="picture" multiple>
                <Button icon={<UploadOutlined />}>Загрузить результаты</Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item name="style_ids" label="Примененный стиль (Опционально)">
            <Select
              mode="multiple"
              showSearch
              placeholder="Выберите стиль (можно вписать поиск)"
              optionFilterProp="label"
              options={stylesList.map(s => ({ value: s.id, label: s.display_name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();
  const [loadingSession, setLoadingSession] = useState(true);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [adjustModalUser, setAdjustModalUser] = useState<UserSummary | null>(null);

  const loadSession = async () => {
    try {
      const result = await adminApi.fetchSession();
      setAdminUser({ email: result.email });
    } catch (err) {
      setAdminUser(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const loadUsers = async (page = usersPage) => {
    setUsersLoading(true);
    try {
      const response = await adminApi.fetchUsers(page);
      setUsers(response.items);
      setUsersTotal(response.total);
      setUsersPage(response.page);
    } catch (err) {
      message.error('Ошибка при загрузке пользователей.');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await adminApi.fetchTransactions();
      setTransactions(response);
    } catch {
      message.error('Ошибка при загрузке транзакций.');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await adminApi.fetchMetrics();
      setMetrics(response);
    } catch {
      message.error('Не удалось получить метрики.');
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadJobs = async (page = jobsPage, status?: string) => {
    setJobsLoading(true);
    try {
      const response = await adminApi.fetchJobs(page, 20, status);
      setJobs(response.items);
      setJobsTotal(response.total);
      setJobsPage(response.page);
    } catch (err) {
      message.error('Ошибка при загрузке задач.');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadUsers();
      loadTransactions();
      loadMetrics();
      loadJobs();
    }
  }, [adminUser]);

  const handleLogin = async (values: LoginPayload) => {
    setAuthError(undefined);
    try {
      await adminApi.login(values);
      await loadSession();
    } catch (err: any) {
      setAuthError(err?.message || 'Ошибка входа');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdminUser(null);
    }
  };

  const handleAdjust = async (user: UserSummary, amount: number, comment?: string) => {
    try {
      await adminApi.adjustBalance(user.user_id, amount, comment);
      message.success('Баланс обновлён');
      setAdjustModalUser(null);
      loadUsers();
    } catch {
      message.error('Не удалось скорректировать баланс.');
    }
  };

  const handleToggleStatus = async (user: UserSummary) => {
    try {
      await adminApi.toggleStatus(user.user_id, !user.is_active);
      message.success('Статус пользователя обновлён');
      loadUsers();
    } catch {
      message.error('Не удалось изменить статус.');
    }
  };

  const handleRerun = async (jobId: string) => {
    try {
      await adminApi.rerunJob(jobId);
      message.success('Задача возвращена в очередь');
      loadJobs(jobsPage, jobStatusFilter || undefined);
    } catch {
      message.error('Не удалось повторно запустить задачу.');
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await adminApi.cancelJob(jobId);
      message.success('Задача отменена');
      loadJobs(jobsPage, jobStatusFilter || undefined);
    } catch {
      message.error('Не удалось отменить задачу.');
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <Layout className="min-h-screen items-center justify-center bg-slate-50">
        <Content className="flex items-center justify-center py-12">
          <LoginForm onLogin={handleLogin} error={authError} />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Content className="p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Панель администратора
          </Title>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Выйти ({adminUser.email})
          </Button>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: 'Пользователи и Финансы',
              children: (
                <div className="space-y-6 mt-4">
                  <section>
                    <Title level={4}>Общее состояние</Title>
                    <AdminStats metrics={metrics} />
                  </section>
                  <UsersSection
                    users={users} loading={usersLoading} page={usersPage} total={usersTotal}
                    onPageChange={(page) => loadUsers(page)} onRefresh={() => loadUsers(usersPage)}
                    onAdjust={(user) => setAdjustModalUser(user)} onToggle={handleToggleStatus}
                  />
                  <TransactionsSection data={transactions} loading={transactionsLoading} onRefresh={loadTransactions} />
                </div>
              ),
            },
            {
              key: '2',
              label: 'Задачи',
              children: (
                <div className="mt-4">
                  <Card title="Задачи">
                    <Form layout="inline" className="mb-4">
                      <Form.Item label="Статус">
                        <Input placeholder="status" value={jobStatusFilter} onChange={(event) => setJobStatusFilter(event.target.value)} />
                      </Form.Item>
                      <Form.Item><Button type="primary" onClick={() => loadJobs(1, jobStatusFilter)}>Подобрать</Button></Form.Item>
                      <Form.Item><Button onClick={() => { setJobStatusFilter(''); loadJobs(); }}>Сбросить</Button></Form.Item>
                    </Form>
                    <Table
                      rowKey="reservation_id" dataSource={jobs} loading={jobsLoading}
                      pagination={{ current: jobsPage, total: jobsTotal, pageSize: 20, onChange: (page) => loadJobs(page, jobStatusFilter || undefined) }}
                      columns={[
                        { title: 'Job / Reservation', dataIndex: 'job_id', key: 'job', render: (_: string | null, record: JobSummary) => (<span>{record.job_id ?? record.reservation_id}</span>) },
                        { title: 'Статус', dataIndex: 'status', key: 'status' },
                        { title: 'Пользователь', dataIndex: 'user_email', key: 'user' },
                        { title: 'Дата обновления', dataIndex: 'updated_at', key: 'updated', render: (value: string) => new Date(value).toLocaleString() },
                        { title: 'Действия', key: 'actions', render: (_: unknown, record: JobSummary) => (
                            <div className="flex gap-2">
                              <Button size="small" onClick={() => handleRerun(record.job_id ?? record.reservation_id)}>Повторить</Button>
                              <Button size="small" danger onClick={() => handleCancel(record.job_id ?? record.reservation_id)}>Отменить</Button>
                            </div>
                          )
                        },
                      ]}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: '3',
              label: 'Галерея промптов',
              children: (
                <div className="mt-4">
                  <GallerySection />
                </div>
              ),
            },
          ]}
        />

        <AdjustModal user={adjustModalUser} open={Boolean(adjustModalUser)} onClose={() => setAdjustModalUser(null)} onSubmit={handleAdjust} />
      </Content>
      <Footer className="text-center">© 2025 NanoVisual Admin</Footer>
    </Layout>
  );
};

export default App;
