
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

export type AuthMeResponse = {
  email: string;
  email_verified: boolean;
  balance: number;
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
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    email: string;
    password: string;
    googleAuth: string;
    noAccount: string;
    haveAccount: string;
    or: string;
  };
}
