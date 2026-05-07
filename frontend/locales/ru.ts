
import { TranslationSchema } from '../types';
import { ruStyleNames, ruSizeLabels } from './styleNames';

export const ru: TranslationSchema = {
  common: {
    generate: "Создать",
    cancel: "Отмена",
    reset: "Сбросить",
    download: "Скачать",
    login: "Войти",
    register: "Регистрация",
    logout: "Выйти",
    profile: "Профиль",
    settings: "Настройки",
    loading: "Загрузка...",
    error: "Ошибка",
    success: "Успех",
    close: "Закрыть",
    back: "Назад",
    more: "Ещё",
    done: "Готово",
    tryAgain: "Попробовать снова"
  },
  hero: {
    title: "Раскрой свой творческий потенциал с ИИ",
    subtitle: "Превращай простые слова в потрясающие визуальные образы. Будущее генерации изображений уже здесь, доступное каждому.",
    cta: "Начать творить",
    badge: "Представляем движок Gen-V",
    learnMore: "Узнать больше"
  },
  features: {
    tag: "Процесс",
    title: "Создано для искусства",
    description: "От идеи до шедевра за секунды. Наша облачная архитектура берет на себя всю сложность, пока вы управляете творчеством.",
    step1Title: "Опишите",
    step1Desc: "Используйте обычные слова, чтобы рассказать ИИ о своей задумке.",
    step2Title: "Уточните",
    step2Desc: "Настройте каждый пиксель с помощью нашей библиотеки стилей и пресетов.",
    step3Title: "Экспорт",
    step3Desc: "Скачивайте свои творения в высоком разрешении и делитесь ими с миром.",
  },
  generator: {
    promptPlaceholder: "Введите тут свое описание того, что должно получиться, например: 'Стильный женский рюкзак из черной кожи, стоит на мраморном подиуме, студийный свет, оставить место для текста сверху'...",
    helperText: "Опиши то, что хочешь увидеть, простыми словами.",
    styles: "Стили",
    size: "Размер",
    photos: "Фото",
    aspectRatio: "Соотношение",
    quality: "Качество",
    popularStyles: "Популярные",
    openLibrary: "Библиотека стилей",
    uploadPhoto: "Загрузить фото",
    photoLimit: "Макс. {limit} фото",
    photoInstructions: "Загрузи фото, чтобы использовать его как основу для генерации.",
    photoUnavailable: "Текущий движок не поддерживает загрузку фото.",
    initializing: "Инициализация...",
    readyTitle: "Готовы визуализировать?",
    crafting: "Создаем ваш образ",
    outOfBalance: "Генерации закончились. Пожалуйста, пополните баланс.",
    searchStyles: "Поиск стилей...",
    noStylesFound: "Стили не найдены",
    defaultStyle: "Без стиля",
    newGeneration: "Новая генерация",
    styleNames: ruStyleNames,
    sizeLabels: ruSizeLabels
  },
  history: {
    title: "История генераций",
    empty: "Здесь появятся последние изображения.",
    showMore: "Показать всё",
    modalTitle: "Ваши шедевры",
    modalClose: "Закрыть",
    pageLabel: "Страница",
    prev: "Назад",
    next: "Вперёд",
    promptLabel: "Запрос",
    stylesLabel: "Стили",
    download: "Скачать",
    delete: "Удалить",
    open: "Развернуть",
    deleteConfirm: "Удалить запись из истории?",
    projectsTitle: "Проекты",
    allGenerations: "Все картинки",
    unsorted: "Без проекта",
    newProject: "Новый проект...",
    moveTo: "Переместить",
    create: "Создать"
  },
  profile: {
    balance: "Баланс",
    refill: "Пополнить генерации",
    verified: "Почта подтверждена",
    notVerified: "Почта не подтверждена",
    resendEmail: "Выслать подтверждение",
    changePassword: "Сменить пароль",
    buyGenerations: "Купить пакет",
    unitPrice: "Цена за штуку",
    totalPrice: "Итого",
    pay: "Оплатить",
    currency: "₽",
    units: "шт.",
    historyTitle: "История транзакций",
    historyEmpty: "Покупок ещё не было.",
    historyButton: "Посмотреть историю транзакций",
    historyDefaultComment: "Покупка генераций",
    historyKinds: {
      purchase: "Пополнение",
      trial: "Бонус",
      refund: "Возврат",
      generation: "Списание"
    }
    ,
    historyDescriptions: {
      purchase: "Покупка генераций",
      trial: "Приветственный бонус",
      refund: "Возврат",
      generation: "Списание генераций"
    },
    historyAmountLabel: "Стоимость",
    changePasswordTitle: "Сменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Повторите новый пароль",
    changePasswordSubmit: "Обновить пароль",
    passwordMismatch: "Пароли не совпадают.",
    passwordChangeSuccess: "Пароль обновлён.",
    passwordChangeError: "Не удалось сменить пароль."
  },
  auth: {
    loginTitle: "С возвращением",
    registerTitle: "Присоединяйся к NanoVisual",
    loginSubtitle: "Войди, чтобы продолжить творчество.",
    registerSubtitle: "Создай аккаунт и получи бонусные генерации.",
    email: "Email адрес",
    password: "Пароль (мин. 8 символов)",
    noAccount: "Нет аккаунта?",
    haveAccount: "Уже есть аккаунт?",
    or: "Или"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "Политика конфиденциальности",
    terms: "Условия",
    docs: "Документация",
    support: "Поддержка"
    ,
    supportTitle: "Нужна помощь?",
    supportDescription: "Напиши нам, и мы оперативно ответим на любой вопрос.",
    supportEmailLabel: "Почта",
    supportEmail: "support@nanovisual.ai",
    supportClose: "Закрыть"
  },
  promo: {
    tagline: "Присоединяйся к 10 000+ творцам уже сегодня",
    subtext: "Платформа, созданная для быстрого создания визуалов."
  }
  ,
  admin: {
    title: "Админ-панель",
    subtitle: "Контроль пользователей, балансов и транзакций в одном окне.",
    usersTab: "Пользователи",
    transactionsTab: "Транзакции",
    filters: {
      email: "Email",
      role: "Роль",
      status: "Статус",
      search: "Поиск",
      reset: "Сбросить"
    },
    headings: {
      email: "Email",
      balance: "Баланс",
      role: "Роль",
      status: "Статус",
      actions: "Действия",
      created: "Создан"
    },
    actions: {
      adjustBalance: "Изменить баланс",
      toggleActive: "Отключить",
      toggleInactive: "Включить",
      changeBalancePrompt: "Введите сумму для баланса (+/-)"
    },
    status: {
      active: "Активен",
      inactive: "Заморожен"
    },
    prompts: {
      balanceAmount: "Сумма для корректировки (+/-)",
      statusConfirm: "Подтвердите изменение статуса?"
    },
    pagination: {
      prev: "Назад",
      next: "Вперёд",
      page: "Страница"
    },
    notifications: {
      balanceUpdated: "Баланс обновлён",
      statusUpdated: "Статус обновлён",
      jobRerun: "Задача возвращена в очередь",
      jobCancel: "Задача отменена"
    }
    ,
    jobsTab: "Задачи",
    metricsTab: "Метрики",
    jobsTable: {
      title: "Задачи генерации",
      jobId: "Job / Резерв",
      statusLabel: "Статус",
      userEmail: "Пользователь",
      created: "Создано",
      updated: "Обновлено",
      actions: {
        rerun: "Повторить",
        cancel: "Отменить"
      },
      empty: "Задачи не найдены"
    },
    billing: {
      title: "Транзакции",
      filters: {
        kind: "Тип транзакции"
      },
      totalAmount: "Сумма",
      totalCount: "Записей",
      kindLabel: "Тип",
      userLabel: "Email",
      deltaLabel: "Изменение",
      amountLabel: "Сумма",
      createdLabel: "Дата",
      currency: "₽",
      empty: "Транзакций пока нет"
    },
    metrics: {
      title: "Панель KPI",
      tagline: "Свежие показатели",
      dailyGens: "Генераций / день",
      dailyRevenue: "Доход / день",
      totalLabel: "Всего за неделю",
      apiErrors: "Ошибки API",
      failureRate: "Процент отказов",
      backlogTitle: "Backlog",
      reload: "Обновляется"
    }
  },
};
