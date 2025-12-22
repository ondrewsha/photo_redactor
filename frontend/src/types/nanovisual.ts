export type StyleCategoryPublic = {
  id: string;
  display_name: string;
  preview_image: string;
};

export type PromptMode = "enhance" | "creative";

export type ComposePromptRequest = {
  style_id: string;
  user_input: string;
  mode: PromptMode;
};

export type ComposePromptResponse = {
  style_id: string;
  mode: PromptMode;
  enhanced_user_input: string;
  final_prompt: string;
};

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type CreateJobRequest = {
  prompt: string;
  width: number;
  height: number;
  seed: number | null;
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
