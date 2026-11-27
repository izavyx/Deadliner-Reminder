export type TaskAttachment = {
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
  signed_url?: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  course: string;
  deadline: string;
  notes: string;
  is_done: boolean;
  attachments?: TaskAttachment[];
  created_at: string;
};
