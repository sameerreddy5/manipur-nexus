export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      academic_queries: {
        Row: {
          attachments: string[] | null
          course_id: string | null
          created_at: string
          faculty_id: string
          id: string
          message: string
          parent_id: string | null
          query_id: string | null
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          course_id?: string | null
          created_at?: string
          faculty_id: string
          id?: string
          message: string
          parent_id?: string | null
          query_id?: string | null
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          course_id?: string | null
          created_at?: string
          faculty_id?: string
          id?: string
          message?: string
          parent_id?: string | null
          query_id?: string | null
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_academic_queries_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_academic_queries_faculty"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_academic_queries_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "academic_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_academic_queries_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_urgent: boolean
          target_roles: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_urgent?: boolean
          target_roles?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_urgent?: boolean
          target_roles?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      backend_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check: string
          response_time: number | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          response_time?: number | null
          service_name: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check?: string
          response_time?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          name: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          batch_id: string
          course_id: string
          created_at: string
          faculty_id: string
          id: string
          semester: string
          updated_at: string
          year: number
        }
        Insert: {
          batch_id: string
          course_id: string
          created_at?: string
          faculty_id: string
          id?: string
          semester: string
          updated_at?: string
          year: number
        }
        Update: {
          batch_id?: string
          course_id?: string
          created_at?: string
          faculty_id?: string
          id?: string
          semester?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_course_assignments_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_course_assignments_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_course_assignments_faculty"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number
          department_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          department_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          department_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_courses_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          hod_id: string | null
          id: string
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          hod_id?: string | null
          id?: string
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          hod_id?: string | null
          id?: string
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_hod_id_fkey"
            columns: ["hod_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          bucket_name: string
          category: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          is_deleted: boolean
          mime_type: string
          original_name: string
          related_id: string | null
          related_type: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          category?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_deleted?: boolean
          mime_type: string
          original_name: string
          related_id?: string | null
          related_type?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          category?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_deleted?: boolean
          mime_type?: string
          original_name?: string
          related_id?: string | null
          related_type?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      hostel_complaints: {
        Row: {
          created_at: string
          description: string
          hostel_block: string
          id: string
          issue_type: string
          room_number: string
          status: string
          student_id: string
          updated_at: string
          warden_remarks: string | null
        }
        Insert: {
          created_at?: string
          description: string
          hostel_block: string
          id?: string
          issue_type: string
          room_number: string
          status?: string
          student_id: string
          updated_at?: string
          warden_remarks?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          hostel_block?: string
          id?: string
          issue_type?: string
          room_number?: string
          status?: string
          student_id?: string
          updated_at?: string
          warden_remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hostel_complaints_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mess_menus: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          items: string[]
          meal_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          items?: string[]
          meal_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          items?: string[]
          meal_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mess_menus_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          roll_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role: string
          roll_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          roll_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_views: {
        Row: {
          id: string
          report_config_id: string
          view_duration: number | null
          viewed_at: string
          viewed_by: string
        }
        Insert: {
          id?: string
          report_config_id: string
          view_duration?: number | null
          viewed_at?: string
          viewed_by: string
        }
        Update: {
          id?: string
          report_config_id?: string
          view_duration?: number | null
          viewed_at?: string
          viewed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_views_config"
            columns: ["report_config_id"]
            isOneToOne: false
            referencedRelation: "reports_config"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_config: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          report_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          report_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports_data: {
        Row: {
          data: Json
          expires_at: string | null
          generated_at: string
          generated_by: string
          id: string
          report_config_id: string
        }
        Insert: {
          data: Json
          expires_at?: string | null
          generated_at?: string
          generated_by: string
          id?: string
          report_config_id: string
        }
        Update: {
          data?: Json
          expires_at?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          report_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_data_config"
            columns: ["report_config_id"]
            isOneToOne: false
            referencedRelation: "reports_config"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          batch_id: string
          created_at: string
          day_of_week: number
          faculty_id: string | null
          id: string
          room: string | null
          subject: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          day_of_week: number
          faculty_id?: string | null
          id?: string
          room?: string | null
          subject: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          day_of_week?: number
          faculty_id?: string | null
          id?: string
          room?: string | null
          subject?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_timetables_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timetables_faculty"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
