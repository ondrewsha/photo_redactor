
import { TranslationSchema } from '../types';
import { englishStyleNames, defaultSizeLabels } from './styleNames';

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
    promptPlaceholder: "Неон тұмандығында қалықтап жүрген ғарыш костюміндегі мысық...",
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
    styleNames: englishStyleNames,
    sizeLabels: defaultSizeLabels
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
    units: "дана"
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
  },
  promo: {
    tagline: "Қазір 10 000+ шығармашыл адамдармен қосылыңыз",
    subtext: "Жылдам және әдемі визуалдар жасауға арналған AI студиясы."
  }
};
