export type AppRole = 'superadmin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  name: string;
  status: 'active' | 'inactive';
  progress: number;
  grade: string | null;
  subjects: string[] | null;
  parent_name: string | null;
  parent_contact: string | null;
  enrollment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Limited view for teachers
export interface StudentTeacherView {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  progress: number;
  grade: string | null;
  subjects: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
}

export interface TeacherStudent {
  id: string;
  teacher_id: string;
  student_id: string;
  assigned_at: string;
}
