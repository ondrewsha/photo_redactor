
import { TranslationSchema } from '../types';
import { kkStyleNames, kkSizeLabels } from './styleNames';

export const kk: TranslationSchema = {
  common: {
    generate: "Жасау",
    cancel: "Болдырмау",
    reset: "Қалпына келтіру",
    download: "Жүктеу",
    login: "Кіру",
    register: "Тіркелу",
    logout: "Шығу",
    profile: "Профиль",
    settings: "Баптаулар",
    loading: "Жүктелуде...",
    error: "Қате",
    success: "Сәтті",
    close: "Жабу",
    back: "Артқа",
    more: "Тағы",
    done: "Дайын",
    // Fix: Added missing tryAgain key
    tryAgain: "Қайтадан байқап көру"
  },
  hero: {
    title: "ЖИ-мен шығармашылығыңызды ашыңыз",
    subtitle: "Қарапайым сөздерді таңғажайып бейнелерге айналдырыңыз. Кескін жасаудың болашағы осында, барлығына қолжетімді.",
    cta: "Жасауды бастау",
    // Fix: Added missing badge and learnMore keys
    badge: "Gen-V қозғалтқышымен таныстыру",
    learnMore: "Толығырақ"
  },
  // Fix: Added missing features section
  features: {
    tag: "Процесс",
    title: "Өнер үшін жасалған",
    description: "Идеядан шедеврге дейін бірнеше секундта. Біздің бұлттық архитектурамыз күрделілікті өз мойнына алады, ал сіз шығармашылық бағытты басқарасыз.",
    step1Title: "Сипаттаңыз",
    step1Desc: "ЖИ-ге нені елестететініңізді дәл айту үшін табиғи тілді қолданыңыз.",
    step2Title: "Нақтылаңыз",
    step2Desc: "Біздің кеңейтілген стильдер кітапханасы мен пресеттерімізді пайдаланып әр пиксельді баптаңыз.",
    step3Title: "Экспорттау",
    step3Desc: "Туындыңызды жоғары ажыратымдылықта жүктеп алып, әлеммен бөлісіңіз.",
  },
  generator: {
    promptPlaceholder: "Мұнда көргіңіз келетін нәрсенің сипаттамасын енгізіңіз, мысалы: 'Мәрмәр подиумға қойылған, қара былғарыдан жасалған стильді әйелдер рюкзактары, студияның жарығы, жоғарғы жағында мәтінге орын қалдырыңыз'...",
    helperText: "Көргіңіз келетін нәрсені қарапайым сөздермен сипаттаңыз.",
    styles: "Стильдер",
    size: "Өлшем",
    photos: "Фотолар",
    aspectRatio: "Қатынасы",
    quality: "Сапасы",
    popularStyles: "Танымал",
    openLibrary: "Стильдер кітапханасы",
    uploadPhoto: "Фото жүктеу",
    photoLimit: "Макс. {limit} фото",
    photoInstructions: "Генерация үшін негіз ретінде пайдалану үшін фото жүктеңіз.",
    photoUnavailable: "Қазіргі модель фотосуреттерді жүктеуді қолдамайды.",
    // Fix: Added missing generator control keys
    initializing: "Қозғалтқыш іске қосылуда...",
    readyTitle: "Визуализациялауға дайынсыз ба?",
    crafting: "Сіздің бейнеңізді жасауда",
    outOfBalance: "Генерациялар таусылды. Балансыңызды толтырыңыз.",
    searchStyles: "Стильдерді іздеу...",
    noStylesFound: "Стильдер табылмады",
    defaultStyle: "Стиль жоқ",
    newGeneration: "Жаңа генерация",
    styleNames: kkStyleNames,
    sizeLabels: kkSizeLabels
  },
  history: {
    title: "Генерациялар тарихы",
    empty: "Әлі сақталған генерациялар жоқ.",
    showMore: "Барлығын көрсету",
    modalTitle: "Сіздің шедеврлеріңіз",
    modalClose: "Жабу",
    pageLabel: "Бет",
    prev: "Артқа",
    next: "Алға",
    promptLabel: "Сұраныс",
    stylesLabel: "Қолданылған стильдер",
    download: "Жүктеу",
    delete: "Өшіру",
    open: "Толық ашу",
    deleteConfirm: "Бұл жазбаны тарихтан алып тастау керек пе?",
    projectsTitle: "Жобалар",
    allGenerations: "Барлық генерациялар",
    unsorted: "Жобасыз",
    newProject: "Жаңа жоба...",
    moveTo: "Қозғалыс",
    create: "Жасау"
  },
  profile: {
    balance: "Баланс",
    refill: "Генерацияларды толтыру",
    verified: "Пошта расталды",
    notVerified: "Пошта расталмаған",
    resendEmail: "Растауды қайта жіберу",
    changePassword: "Құпия сөзді өзгерту",
    buyGenerations: "Пакетті сатып алу",
    unitPrice: "Бір данасы үшін бағасы",
    totalPrice: "Жиынтығы",
    pay: "Төлеу",
    // Fix: Added missing currency key
    currency: "₸",
    units: "дана",
    historyTitle: "Транзакциялар тарихы",
    historyEmpty: "Әлі сатып алулар жоқ.",
    historyButton: "Транзакциялар тарихын қарау",
    historyDefaultComment: "Генерация пакеті",
    historyKinds: {
      purchase: "Толтыру",
      trial: "Бонус",
      refund: "Қайтару",
      generation: "Шығыстар"
    }
    ,
    historyDescriptions: {
      purchase: "Генерация пакеті",
      trial: "Қош келдіңіз бонусы",
      refund: "Қайтару",
      generation: "Генерацияларды пайдалану"
    },
    historyAmountLabel: "Сома",
    changePasswordTitle: "Құпия сөзді өзгерту",
    currentPassword: "Ағымдағы құпия сөз",
    newPassword: "Жаңа құпия сөз",
    confirmPassword: "Жаңа құпия сөзді қайталау",
    changePasswordSubmit: "Құпия сөзді жаңарту",
    passwordMismatch: "Құпиясөздер сәйкес емес.",
    passwordChangeSuccess: "Құпия сөз жаңартылды.",
    passwordChangeError: "Құпия сөзді өзгерту мүмкін болмады."
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
      jobRerun: "Жұмыс қайта тапсырылды",
      jobCancel: "Жұмыс тоқтатылды"
    },
    jobsTab: "Жұмыстар",
    metricsTab: "Метрикалар",
    jobsTable: {
      title: "Генерация жұмыстары",
      jobId: "Жұмыс / Резерв",
      statusLabel: "Қалып",
      userEmail: "Пайдаланушы",
      created: "Құрылған",
      updated: "Жаңартылған",
      actions: {
        rerun: "Қайта қосу",
        cancel: "Тоқтату"
      },
      empty: "Жұмыстар табылмады"
    },
    billing: {
      title: "Транзакциялар",
      filters: {
        kind: "Транзакция түрі"
      },
      totalAmount: "Сома",
      totalCount: "Жазбалар",
      kindLabel: "Түрі",
      userLabel: "Email",
      deltaLabel: "Өзгеріс",
      amountLabel: "Сома",
      createdLabel: "Күні",
      currency: "RUB",
      empty: "Транзакция жоқ"
    },
    metrics: {
      title: "Insights",
      tagline: "Тікелей көрсеткіштер",
      dailyGens: "Генерациялар / күн",
      dailyRevenue: "Кіріс / күн",
      totalLabel: "Апталық жиынтық",
      apiErrors: "API қателері",
      failureRate: "Қателік пайызы",
      backlogTitle: "Backlog",
      reload: "Жаңартылып жатыр"
    }
  },
  auth: {
    loginTitle: "Қайта қош келдіңіз",
    registerTitle: "NanoVisual-ға қосылыңыз",
    loginSubtitle: "Шығармашылықты жалғастыру үшін кіріңіз.",
    registerSubtitle: "Аккаунт жасап, бонустық генерациялар алыңыз.",
    email: "Email мекенжайы",
    password: "Құпия сөз (кемінде 8 таңба)",
    noAccount: "Аккаунт жоқ па?",
    haveAccount: "Аккаунт бар ма?",
    // Fix: Added missing or key
    or: "Немесе"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "Құпиялылық саясаты",
    terms: "Қолдану шарттары",
    docs: "Құжаттама",
    support: "Қолдау"
    ,
    supportTitle: "Көмек керек пе?",
    supportDescription: "Сұрағыңызды жіберсеңіз, тез жауап береміз.",
    supportEmailLabel: "Пошта",
    supportEmail: "support@nanovisual.ai",
    supportClose: "Жабу"
  },
  promo: {
    tagline: "Қазір 10 000+ шығармашыл адамдармен қосылыңыз",
    subtext: "Жылдам және әдемі визуалдар жасауға арналған AI студиясы."
  }
};
