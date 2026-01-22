export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          due_date: string | null
          file_name: string
          file_path: string
          id: string
          student_id: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          file_name: string
          file_path: string
          id?: string
          student_id?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          file_name?: string
          file_path?: string
          id?: string
          student_id?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          start_date: string
          status: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason: string
          start_date: string
          status?: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          start_date?: string
          status?: string
          teacher_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          student_id: string | null
          teacher_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          student_id?: string | null
          teacher_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          student_id?: string | null
          teacher_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          id: string
          meet_link: string | null
          scheduled_at: string
          status: string
          student_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meet_link?: string | null
          scheduled_at: string
          status?: string
          student_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          meet_link?: string | null
          scheduled_at?: string
          status?: string
          student_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          enrollment_date: string | null
          grade: string | null
          id: string
          name: string
          notes: string | null
          parent_contact: string | null
          parent_name: string | null
          progress: number
          status: string
          subjects: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enrollment_date?: string | null
          grade?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_contact?: string | null
          parent_name?: string | null
          progress?: number
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enrollment_date?: string | null
          grade?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_contact?: string | null
          parent_name?: string | null
          progress?: number
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          file_name: string
          file_path: string
          id: string
          reviewed_at: string | null
          status: string
          student_id: string
          submitted_at: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_name: string
          file_path: string
          id?: string
          reviewed_at?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_name?: string
          file_path?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_students: {
        Row: {
          assigned_at: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students_teacher_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      students_teacher_view: {
        Row: {
          created_at: string | null
          grade: string | null
          id: string | null
          name: string | null
          progress: number | null
          status: string | null
          subjects: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grade?: string | null
          id?: string | null
          name?: string | null
          progress?: number | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grade?: string | null
          id?: string | null
          name?: string | null
          progress?: number | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_student: {
        Args: { _student_id: string; _teacher_id: string }
        Returns: boolean
      }
      is_student_user: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "teacher", "student"],
    },
  },
} as const
