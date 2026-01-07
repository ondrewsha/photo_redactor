import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Layout, Typography, Row, Col, Card, Statistic, Table, Button, Switch, Modal, Form, Input, InputNumber, Spin, message, Divider, } from 'antd';
import { LogoutOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { adminApi, } from './api/admin';
const { Content, Footer } = Layout;
const { Title } = Typography;
const LoginForm = ({ onLogin, error, }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await onLogin(values);
        }
        catch (err) {
            message.error('Не удалось войти. Проверьте логин/пароль.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Col, { span: 24, md: 12, lg: 8, className: "mx-auto", children: _jsxs(Card, { children: [_jsx(Title, { level: 3, className: "text-center", children: "\u0410\u0434\u043C\u0438\u043D\u043A\u0430 NanoVisual" }), _jsxs(Form, { form: form, layout: "vertical", onFinish: handleSubmit, requiredMark: false, children: [_jsx(Form.Item, { label: "Email", name: "email", rules: [{ required: true, message: 'Введите email' }], children: _jsx(Input, { prefix: _jsx(UserOutlined, {}), placeholder: "admin@nanovi.ru" }) }), _jsx(Form.Item, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", name: "password", rules: [{ required: true, message: 'Введите пароль' }], children: _jsx(Input.Password, { placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }) }), error && (_jsx(Typography.Text, { type: "danger", className: "block mb-2", children: error })), _jsx(Form.Item, { children: _jsx(Button, { block: true, type: "primary", htmlType: "submit", loading: loading, children: "\u0412\u043E\u0439\u0442\u0438" }) })] })] }) }));
};
const AdminStats = ({ metrics }) => {
    if (!metrics) {
        return _jsx(Spin, {});
    }
    const { api_errors, failure_rate, backlog, webhooks } = metrics;
    return (_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 8, children: _jsx(Card, { children: _jsx(Statistic, { title: "API \u043E\u0448\u0438\u0431\u043A\u0438", value: api_errors, prefix: _jsx(DollarOutlined, {}), precision: 0 }) }) }), _jsx(Col, { xs: 24, md: 8, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043E\u0442\u043A\u0430\u0437\u043E\u0432", value: failure_rate, precision: 2, suffix: "%" }) }) }), _jsx(Col, { xs: 24, md: 8, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "\u0412\u0441\u0435\u0433\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u0438", value: Object.keys(backlog).length }), _jsxs("div", { className: "mt-2 text-sm", children: [Object.entries(backlog).map(([key, value]) => (_jsxs("div", { children: [key, ": ", _jsx("strong", { children: value })] }, key))), Object.keys(webhooks).length > 0 && (_jsxs(_Fragment, { children: [_jsx(Divider, { className: "my-2" }), _jsx("div", { children: "Webhooks:" }), Object.entries(webhooks).map(([key, value]) => (_jsxs("div", { children: [key, ": ", _jsx("strong", { children: value })] }, key)))] }))] })] }) })] }));
};
const UsersSection = ({ users, loading, page, total, onPageChange, onAdjust, onToggle, onRefresh }) => {
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
            render: (_, record) => (_jsx(Switch, { checked: record.is_active, onChange: () => onToggle(record) })),
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (_jsx(Button, { type: "link", onClick: () => onAdjust(record), children: "\u0421\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441" })),
        },
    ];
    return (_jsx(Card, { title: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438", extra: _jsx(Button, { type: "link", onClick: onRefresh, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }), children: _jsx(Table, { rowKey: "user_id", columns: columns, dataSource: users, loading: loading, pagination: {
                current: page,
                total,
                pageSize: 20,
                showSizeChanger: false,
                onChange: onPageChange,
            } }) }));
};
const TransactionsSection = ({ data, loading, onRefresh }) => {
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
            render: (value) => `${value} NV`,
        },
        {
            title: 'Валюта',
            dataIndex: 'amount_rub',
            key: 'amount',
            render: (value) => (value ? `${value} ₽` : '-'),
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
            render: (value) => new Date(value).toLocaleString(),
        },
    ];
    return (_jsx(Card, { title: "\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438", extra: _jsx(Button, { type: "link", onClick: onRefresh, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }), children: _jsx(Table, { rowKey: "transaction_id", dataSource: data?.items ?? [], columns: columns, loading: loading, pagination: false }) }));
};
const AdjustModal = ({ user, open, onClose, onSubmit }) => {
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
    return (_jsx(Modal, { title: `Корректировка баланса ${user?.email ?? ''}`, open: open, onCancel: onClose, onOk: handleOk, children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { label: "\u0421\u0443\u043C\u043C\u0430 (NV)", name: "amount", rules: [{ required: true, message: 'Введите сумму' }], children: _jsx(InputNumber, { className: "w-full", min: -1000000, max: 1000000 }) }), _jsx(Form.Item, { label: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439", name: "comment", children: _jsx(Input.TextArea, { rows: 3 }) })] }) }));
};
const App = () => {
    const [adminUser, setAdminUser] = useState(null);
    const [authError, setAuthError] = useState();
    const [loadingSession, setLoadingSession] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersLoading, setUsersLoading] = useState(false);
    const [transactions, setTransactions] = useState(null);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [jobsPage, setJobsPage] = useState(1);
    const [jobsTotal, setJobsTotal] = useState(0);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobStatusFilter, setJobStatusFilter] = useState('');
    const [adjustModalUser, setAdjustModalUser] = useState(null);
    const loadSession = async () => {
        try {
            const result = await adminApi.fetchSession();
            setAdminUser({ email: result.email });
        }
        catch (err) {
            setAdminUser(null);
        }
        finally {
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
        }
        catch (err) {
            message.error('Ошибка при загрузке пользователей.');
        }
        finally {
            setUsersLoading(false);
        }
    };
    const loadTransactions = async () => {
        setTransactionsLoading(true);
        try {
            const response = await adminApi.fetchTransactions();
            setTransactions(response);
        }
        catch {
            message.error('Ошибка при загрузке транзакций.');
        }
        finally {
            setTransactionsLoading(false);
        }
    };
    const loadMetrics = async () => {
        setMetricsLoading(true);
        try {
            const response = await adminApi.fetchMetrics();
            setMetrics(response);
        }
        catch {
            message.error('Не удалось получить метрики.');
        }
        finally {
            setMetricsLoading(false);
        }
    };
    const loadJobs = async (page = jobsPage, status) => {
        setJobsLoading(true);
        try {
            const response = await adminApi.fetchJobs(page, 20, status);
            setJobs(response.items);
            setJobsTotal(response.total);
            setJobsPage(response.page);
        }
        catch (err) {
            message.error('Ошибка при загрузке задач.');
        }
        finally {
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
    const handleLogin = async (values) => {
        setAuthError(undefined);
        try {
            await adminApi.login(values);
            await loadSession();
        }
        catch (err) {
            setAuthError(err?.message || 'Ошибка входа');
            throw err;
        }
    };
    const handleLogout = async () => {
        try {
            await adminApi.logout();
        }
        finally {
            setAdminUser(null);
        }
    };
    const handleAdjust = async (user, amount, comment) => {
        try {
            await adminApi.adjustBalance(user.user_id, amount, comment);
            message.success('Баланс обновлён');
            setAdjustModalUser(null);
            loadUsers();
        }
        catch {
            message.error('Не удалось скорректировать баланс.');
        }
    };
    const handleToggleStatus = async (user) => {
        try {
            await adminApi.toggleStatus(user.user_id, !user.is_active);
            message.success('Статус пользователя обновлён');
            loadUsers();
        }
        catch {
            message.error('Не удалось изменить статус.');
        }
    };
    const handleRerun = async (jobId) => {
        try {
            await adminApi.rerunJob(jobId);
            message.success('Задача возвращена в очередь');
            loadJobs(jobsPage, jobStatusFilter || undefined);
        }
        catch {
            message.error('Не удалось повторно запустить задачу.');
        }
    };
    const handleCancel = async (jobId) => {
        try {
            await adminApi.cancelJob(jobId);
            message.success('Задача отменена');
            loadJobs(jobsPage, jobStatusFilter || undefined);
        }
        catch {
            message.error('Не удалось отменить задачу.');
        }
    };
    if (loadingSession) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Spin, {}) }));
    }
    if (!adminUser) {
        return (_jsx(Layout, { className: "min-h-screen items-center justify-center bg-slate-50", children: _jsx(Content, { className: "flex items-center justify-center py-12", children: _jsx(LoginForm, { onLogin: handleLogin, error: authError }) }) }));
    }
    return (_jsxs(Layout, { className: "min-h-screen", children: [_jsxs(Content, { className: "p-6", children: [_jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }, children: [_jsx(Title, { level: 3, style: { margin: 0 }, children: "\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430" }), _jsxs(Button, { icon: _jsx(LogoutOutlined, {}), onClick: handleLogout, children: ["\u0412\u044B\u0439\u0442\u0438 (", adminUser.email, ")"] })] }), _jsxs("section", { className: "mt-6", children: [_jsx(Title, { level: 4, children: "\u041E\u0431\u0449\u0435\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435" }), _jsx(AdminStats, { metrics: metrics })] }), _jsxs("section", { className: "mt-6 space-y-6", children: [_jsx(UsersSection, { users: users, loading: usersLoading, page: usersPage, total: usersTotal, onPageChange: (page) => loadUsers(page), onRefresh: () => loadUsers(usersPage), onAdjust: (user) => setAdjustModalUser(user), onToggle: handleToggleStatus }), _jsx(TransactionsSection, { data: transactions, loading: transactionsLoading, onRefresh: loadTransactions }), _jsxs(Card, { title: "\u0417\u0430\u0434\u0430\u0447\u0438", children: [_jsxs(Form, { layout: "inline", className: "mb-4", children: [_jsx(Form.Item, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", children: _jsx(Input, { placeholder: "status", value: jobStatusFilter, onChange: (event) => setJobStatusFilter(event.target.value) }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", onClick: () => loadJobs(1, jobStatusFilter), children: "\u041F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C" }) }), _jsx(Form.Item, { children: _jsx(Button, { onClick: () => { setJobStatusFilter(''); loadJobs(); }, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C" }) })] }), _jsx(Table, { rowKey: "reservation_id", dataSource: jobs, loading: jobsLoading, pagination: {
                                            current: jobsPage,
                                            total: jobsTotal,
                                            pageSize: 20,
                                            onChange: (page) => loadJobs(page, jobStatusFilter || undefined),
                                        }, columns: [
                                            {
                                                title: 'Job / Reservation',
                                                dataIndex: 'job_id',
                                                key: 'job',
                                                render: (_, record) => (_jsx("span", { children: record.job_id ?? record.reservation_id })),
                                            },
                                            { title: 'Статус', dataIndex: 'status', key: 'status' },
                                            { title: 'Пользователь', dataIndex: 'user_email', key: 'user' },
                                            {
                                                title: 'Дата обновления',
                                                dataIndex: 'updated_at',
                                                key: 'updated',
                                                render: (value) => new Date(value).toLocaleString(),
                                            },
                                            {
                                                title: 'Действия',
                                                key: 'actions',
                                                render: (_, record) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "small", onClick: () => handleRerun(record.job_id ?? record.reservation_id), children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" }), _jsx(Button, { size: "small", danger: true, onClick: () => handleCancel(record.job_id ?? record.reservation_id), children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C" })] })),
                                            },
                                        ] })] })] }), _jsx(AdjustModal, { user: adjustModalUser, open: Boolean(adjustModalUser), onClose: () => setAdjustModalUser(null), onSubmit: handleAdjust })] }), _jsx(Footer, { className: "text-center", children: "\u00A9 2025 NanoVisual Admin" })] }));
};
export default App;
