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
