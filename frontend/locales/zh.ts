
import { TranslationSchema } from '../types';
import { englishStyleNames, defaultSizeLabels } from './styleNames';

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
    styleNames: englishStyleNames,
    sizeLabels: defaultSizeLabels
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
    units: "件"
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
  },
  promo: {
    tagline: "加入 10,000+ 名创作者，一起创作",
    subtext: "为快速生成精美图像而打造的 AI 平台。"
  }
};
