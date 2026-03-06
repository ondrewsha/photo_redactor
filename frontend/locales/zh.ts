
import { TranslationSchema } from '../types';
import { zhStyleNames, zhSizeLabels } from './styleNames';

export const zh: TranslationSchema = {
  common: {
    generate: "生成",
    cancel: "取消",
    reset: "重置",
    download: "下载",
    login: "登录",
    register: "注册",
    logout: "登出",
    profile: "个人资料",
    settings: "设置",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    close: "关闭",
    back: "返回",
    more: "更多",
    done: "完成",
    tryAgain: "重试"
  },
  hero: {
    title: "利用人工智能释放你的创意",
    subtitle: "将简单的文字转化为令人叹为观止的视觉效果。图像生成的未来已经到来，为每个人而简化。",
    cta: "现在开始创建",
    badge: "引入 Gen-V 引擎",
    learnMore: "了解更多"
  },
  features: {
    tag: "过程",
    title: "为艺术而生",
    description: "几秒钟内从概念到杰作。我们的云架构处理复杂性，而您始终控制创意方向。",
    step1Title: "描述",
    step1Desc: "使用自然语言准确告诉人工智能您的想象。",
    step2Title: "完善",
    step2Desc: "使用我们先进的风格库和预设微调每个像素。",
    step3Title: "导出",
    step3Desc: "下载高分辨率的作品并与世界分享。",
  },
  generator: {
    promptPlaceholder: "一只穿着宇航服的猫漂浮在霓虹星云中...",
    helperText: "用简单的语言描述你想看到的内容。",
    styles: "风格",
    size: "尺寸",
    photos: "照片",
    aspectRatio: "纵横比",
    quality: "质量",
    popularStyles: "热门",
    openLibrary: "风格库",
    uploadPhoto: "上传照片",
    photoLimit: "最多 {limit} 张照片",
    photoInstructions: "上传一张照片作为生成的参考。",
    photoUnavailable: "当前引擎不支持上传照片。",
    initializing: "正在初始化引擎...",
    readyTitle: "准备好可视化了吗？",
    crafting: "正在打造您的视觉",
    outOfBalance: "生成次数已用完。请充值。",
    searchStyles: "搜索风格...",
    noStylesFound: "未找到风格",
    defaultStyle: "无样式",
    newGeneration: "新生成",
    styleNames: zhStyleNames,
    sizeLabels: zhSizeLabels
  },
  history: {
    title: "生成历史",
    empty: "暂无保存的生成记录。",
    showMore: "查看全部",
    modalTitle: "您的杰作",
    modalClose: "关闭",
    pageLabel: "页码",
    prev: "上一页",
    next: "下一页",
    promptLabel: "请求",
    stylesLabel: "使用风格",
    download: "下载",
    delete: "删除",
    open: "展开",
    deleteConfirm: "确认从历史中删除该记录？"
  },
  profile: {
    balance: "余额",
    refill: "增加生成次数",
    verified: "邮箱已验证",
    notVerified: "邮箱未验证",
    resendEmail: "重新发送验证",
    changePassword: "修改密码",
    buyGenerations: "购买套餐",
    unitPrice: "单价",
    totalPrice: "总价",
    pay: "完成支付",
    currency: "CNY",
    units: "件",
    historyTitle: "交易记录",
    historyEmpty: "尚无购买记录。",
    historyButton: "查看交易记录",
    historyDefaultComment: "生成次数套餐",
    historyKinds: {
      purchase: "充值",
      trial: "赠送",
      refund: "退款",
      generation: "使用"
    }
    ,
    historyDescriptions: {
      purchase: "生成次数套餐",
      trial: "欢迎赠送",
      refund: "退款",
      generation: "生成次数使用"
    },
    historyAmountLabel: "金额",
    changePasswordTitle: "修改密码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "再次输入新密码",
    changePasswordSubmit: "更新密码",
    passwordMismatch: "两次输入的密码不一致。",
    passwordChangeSuccess: "密码已更新。",
    passwordChangeError: "无法修改密码。"
  },
  admin: {
    title: "Admin dashboard",
    subtitle: "Monitor users, balances, and transactions in one place.",
    usersTab: "Users",
    transactionsTab: "Transactions",
    filters: {
      email: "Email",
      role: "Role",
      status: "Status",
      search: "Search users",
      reset: "Clear filters"
    },
    headings: {
      email: "Email",
      balance: "Balance",
      role: "Role",
      status: "Status",
      actions: "Actions",
      created: "Created"
    },
    actions: {
      adjustBalance: "Adjust balance",
      toggleActive: "Disable",
      toggleInactive: "Enable",
      changeBalancePrompt: "Enter amount to add/subtract"
    },
    status: {
      active: "Active",
      inactive: "Suspended"
    },
    prompts: {
      balanceAmount: "Enter balance adjustment (+/-)",
      statusConfirm: "Confirm status change?"
    },
    pagination: {
      prev: "Prev",
      next: "Next",
      page: "Page"
    },
    notifications: {
      balanceUpdated: "Balance updated",
      statusUpdated: "Status updated",
      jobRerun: "任务已重新执行",
      jobCancel: "任务已取消"
    },
    jobsTab: "任务",
    metricsTab: "指标",
    jobsTable: {
      title: "生成任务",
      jobId: "任务 / 预留",
      statusLabel: "状态",
      userEmail: "用户",
      created: "创建",
      updated: "更新",
      actions: {
        rerun: "重新执行",
        cancel: "取消"
      },
      empty: "暂无任务"
    },
    billing: {
      title: "交易记录",
      filters: {
        kind: "交易类型"
      },
      totalAmount: "总金额",
      totalCount: "总条目",
      kindLabel: "类型",
      userLabel: "邮箱",
      deltaLabel: "变化",
      amountLabel: "金额",
      createdLabel: "日期",
      currency: "RUB",
      empty: "暂无交易"
    },
    metrics: {
      title: "洞察",
      tagline: "实时指标",
      dailyGens: "生成 / 天",
      dailyRevenue: "收入 / 天",
      totalLabel: "周总计",
      apiErrors: "API 错误",
      failureRate: "失败率",
      backlogTitle: "待办",
      reload: "自动刷新"
    }
  },
  auth: {
    loginTitle: "欢迎回来",
    registerTitle: "加入 NanoVisual",
    loginSubtitle: "登录以继续您的创作之旅。",
    registerSubtitle: "创建账户并获得免费生成次数。",
    email: "电子邮箱",
    password: "密码（最少8个字符）",
    noAccount: "还没有账号？",
    haveAccount: "已有账号？",
    or: "或"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "隐私政策",
    terms: "使用条款",
    docs: "文档",
    support: "支持"
    ,
    supportTitle: "需要帮助？",
    supportDescription: "联系我们的团队，我们会尽快回复。",
    supportEmailLabel: "邮箱",
    supportEmail: "support@nanovisual.ai",
    supportClose: "关闭"
  },
  promo: {
    tagline: "加入 10,000+ 名创作者，一起创作",
    subtext: "为快速生成精美图像而打造的 AI 平台。"
  }
};
