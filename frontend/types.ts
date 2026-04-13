
export type Locale = 'en' | 'ru' | 'de' | 'zh' | 'ko' | 'ja' | 'kk';

export type Theme = 'light' | 'dark';

export type StyleCategoryPublic = {
  id: string;
  category: string;
  display_name: string;
  preview_image: string;
};

export type ImageSizePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  aspect_ratio?: string | null;
  quality?: string | null;
};

export type GenerationCapabilities = {
  image_provider: "mock" | "openai" | "gemini";
  model: string;
  supports_source_images: boolean;
  max_photos: number;
  size_presets: ImageSizePreset[];
};

export type GenerateImageRequest = {
  style_ids: string[];
  user_input: string;
  width: number;
  height: number;
  project_id?: string | null;
};

export type GenerateImageWithPhotosRequest = GenerateImageRequest & {
  photos: File[];
};

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type JobResult = {
  image_url: string;
  mime_type: string;
  width: number;
  height: number;
};

export type JobStatusResponse = {
  job_id: string;
  status: JobStatus;
  progress: number;
  result: JobResult | null;
  error_message: string | null;
};

export type HistoryItem = {
  job_id: string;
  user_prompt: string;
  final_prompt: string;
  style_ids: string[];
  image_url: string;
  width: number;
  height: number;
  created_at: string;
  project_id?: string | null;
};

export type HistoryListResponse = {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
};

export type MessageResponse = {
  message: string;
};

export type AuthMeResponse = {
  email: string;
  email_verified: boolean;
  balance: number;
  role: string;
};

export type BillingHistoryItem = {
  transaction_id: string;
  delta: number;
  kind: string;
  comment: string | null;
  created_at: string;
  amount_rub?: number | null;
};

export type BillingHistoryResponse = {
  items: BillingHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUserSummary = {
  user_id: string;
  email: string;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type AdminUsersResponse = {
  items: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUserBalanceRequest = {
  amount: number;
  comment?: string | null;
};

export type AdminUserStatusRequest = {
  is_active: boolean;
};

export type AdminTransactionItem = {
  transaction_id: string;
  email: string;
  delta: number;
  kind: string;
  comment?: string | null;
  amount_rub?: number | null;
  created_at: string;
};

export type AdminTransactionsSummary = {
  by_kind: Record<string, number>;
  total_amount: number;
  total_count: number;
};

export type AdminTransactionsResponse = {
  items: AdminTransactionItem[];
  total: number;
  page: number;
  limit: number;
  summary: AdminTransactionsSummary;
};

export interface TranslationSchema {
  common: {
    generate: string;
    cancel: string;
    reset: string;
    download: string;
    login: string;
    register: string;
    logout: string;
    profile: string;
    settings: string;
    loading: string;
    error: string;
    success: string;
    close: string;
    back: string;
    more: string;
    done: string;
    tryAgain: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    badge: string;
    learnMore: string;
  };
  features: {
    tag: string;
    title: string;
    description: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  generator: {
    promptPlaceholder: string;
    helperText: string;
    styles: string;
    size: string;
    photos: string;
    aspectRatio: string;
    quality: string;
    popularStyles: string;
    openLibrary: string;
    uploadPhoto: string;
    photoLimit: string;
    photoInstructions: string;
    photoUnavailable: string;
    initializing: string;
    readyTitle: string;
    crafting: string;
    outOfBalance: string;
    searchStyles: string;
    noStylesFound: string;
    defaultStyle: string;
    newGeneration: string;
    styleNames: Record<string, string>;
    sizeLabels: Record<string, string>;
  };
  history: {
    title: string;
    empty: string;
    showMore: string;
    modalTitle: string;
    modalClose: string;
    promptLabel: string;
    stylesLabel: string;
    download: string;
    delete: string;
    open: string;
    deleteConfirm: string;
    pageLabel: string;
    prev: string;
    next: string;
    projectsTitle?: string;
    allGenerations?: string;
    unsorted?: string;
    newProject?: string;
    moveTo?: string;
    create?: string;
  };
  promo: {
    tagline: string;
    subtext: string;
  };
  profile: {
    balance: string;
    refill: string;
    verified: string;
    notVerified: string;
    resendEmail: string;
    changePassword: string;
    buyGenerations: string;
    unitPrice: string;
    totalPrice: string;
    pay: string;
    currency: string;
    units: string;
    historyTitle: string;
    historyEmpty: string;
    historyButton: string;
    historyDefaultComment: string;
    historyKinds: Record<string, string>;
    historyDescriptions: Record<string, string>;
    historyAmountLabel: string;
    changePasswordTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    changePasswordSubmit: string;
    passwordMismatch: string;
    passwordChangeSuccess: string;
    passwordChangeError: string;
  };
  footer: {
    brand: string;
    privacy: string;
    terms: string;
    docs: string;
    support: string;
    supportTitle: string;
    supportDescription: string;
    supportEmailLabel: string;
    supportEmail: string;
    supportClose: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    email: string;
    password: string;
    noAccount: string;
    haveAccount: string;
    or: string;
  };
  admin: {
    title: string;
    subtitle: string;
    usersTab: string;
    transactionsTab: string;
    filters: {
      email: string;
      role: string;
      status: string;
      search: string;
      reset: string;
    };
    headings: {
      email: string;
      balance: string;
      role: string;
      status: string;
      actions: string;
      created: string;
    };
    actions: {
      adjustBalance: string;
      toggleActive: string;
      toggleInactive: string;
      changeBalancePrompt: string;
    };
    status: {
      active: string;
      inactive: string;
    };
    prompts: {
      balanceAmount: string;
      statusConfirm: string;
    };
    pagination: {
      prev: string;
      next: string;
      page: string;
    };
    notifications: {
      balanceUpdated: string;
      statusUpdated: string;
      jobRerun: string;
      jobCancel: string;
    };
    jobsTab: string;
    metricsTab: string;
    jobsTable: {
      title: string;
      jobId: string;
      statusLabel: string;
      userEmail: string;
      created: string;
      updated: string;
      actions: {
        rerun: string;
        cancel: string;
      };
      empty: string;
    };
    billing: {
      title: string;
      filters: {
        kind: string;
      };
      totalAmount: string;
      totalCount: string;
      kindLabel: string;
      userLabel: string;
      deltaLabel: string;
      amountLabel: string;
      createdLabel: string;
      currency: string;
      empty: string;
    };
    metrics: {
      title: string;
      tagline: string;
      dailyGens: string;
      dailyRevenue: string;
      totalLabel: string;
      apiErrors: string;
      failureRate: string;
      backlogTitle: string;
      reload: string;
    };
  };
}

export type ProjectItem = {
  id: string;
  name: string;
  created_at: string;
};

export type ProjectListResponse = {
  items: ProjectItem[];
};

export type GalleryItem = {
  id: string;
  prompt: string;
  style_ids: string[];
  result_images: string[];
  input_images: string[];
  created_at: string;
};
export type GalleryListResponse = { items: GalleryItem[] };
