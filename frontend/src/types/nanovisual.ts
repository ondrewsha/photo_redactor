export type StyleCategoryPublic = {
  id: string;
  category: string;
  display_name: string;
  preview_image: string;
};

export type GenerateImageRequest = {
  style_ids: string[];
  user_input: string;
  width: number;
  height: number;
};

export type GenerateImageResponse = {
  job_id: string;
  status: JobStatus;
};

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type CreateJobRequest = {
  prompt: string;
  width: number;
  height: number;
};

export type CreateJobResponse = {
  job_id: string;
  status: JobStatus;
};

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

export type MessageResponse = {
  message: string;
};

export type AuthMeResponse = {
  email: string;
  email_verified: boolean;
  balance: number;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type BillingQuoteResponse = {
  count: number;
  currency: string;
  unit_price_rub: number;
  total_price_rub: number;
  suggestions: number[];
};

export type CreatePaymentRequest = {
  generation_count: number;
};

export type CreatePaymentResponse = {
  payment_id: string;
  status: string;
  confirmation_url: string | null;
  generation_count: number;
  amount_rub: number;
  currency: string;
};
