export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)'
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: Json | null
          id: number
          lesson_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: Json | null
          id?: number
          lesson_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: Json | null
          id?: number
          lesson_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assessments_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      certificate_skills: {
        Row: {
          certificate_id: number
          course_id: number
          created_at: string
          deleted_at: string | null
          id: number
          updated_at: string
        }
        Insert: {
          certificate_id: number
          course_id: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          certificate_id?: number
          course_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certificate_skills_certificate_id_fkey'
            columns: ['certificate_id']
            isOneToOne: false
            referencedRelation: 'certificates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificate_skills_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      certificates: {
        Row: {
          activity_description: string
          activity_duration: number
          activity_end_date: string
          activity_location: string
          activity_start_date: string
          created_at: string
          deleted_at: string | null
          document_url: string | null
          handle: string
          id: number
          issued_at: string | null
          language: Database['public']['Enums']['language']
          organization_id: number
          organization_rating: number
          reviewer_comment: string | null
          reviewer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_duration: number
          activity_end_date: string
          activity_location: string
          activity_start_date: string
          created_at?: string
          deleted_at?: string | null
          document_url?: string | null
          handle: string
          id?: number
          issued_at?: string | null
          language: Database['public']['Enums']['language']
          organization_id: number
          organization_rating: number
          reviewer_comment?: string | null
          reviewer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_duration?: number
          activity_end_date?: string
          activity_location?: string
          activity_start_date?: string
          created_at?: string
          deleted_at?: string | null
          document_url?: string | null
          handle?: string
          id?: number
          issued_at?: string | null
          language?: Database['public']['Enums']['language']
          organization_id?: number
          organization_rating?: number
          reviewer_comment?: string | null
          reviewer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certificates_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contributions: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          lesson_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          lesson_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          lesson_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contributions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contributions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contributions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          description: Json | null
          icon: string | null
          id: number
          languages: Database['public']['Enums']['language'][] | null
          skill_group_id: number | null
          slug: string
          sort_order: number | null
          title: Json | null
          type: Database['public']['Enums']['course_type'] | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: number
          languages?: Database['public']['Enums']['language'][] | null
          skill_group_id?: number | null
          slug: string
          sort_order?: number | null
          title?: Json | null
          type?: Database['public']['Enums']['course_type'] | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: number
          languages?: Database['public']['Enums']['language'][] | null
          skill_group_id?: number | null
          slug?: string
          sort_order?: number | null
          title?: Json | null
          type?: Database['public']['Enums']['course_type'] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_creator_id_fkey1'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'courses_creator_id_fkey1'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'courses_skill_group_id_fkey'
            columns: ['skill_group_id']
            isOneToOne: false
            referencedRelation: 'skill_groups'
            referencedColumns: ['id']
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: Json
          id: number
          lesson_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: Json
          id?: number
          lesson_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: Json
          id?: number
          lesson_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evaluations_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          content: Json | null
          course_id: number
          created_at: string
          deleted_at: string | null
          id: number
          sort_order: number
          title: Json
          updated_at: string
        }
        Insert: {
          content?: Json | null
          course_id: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          sort_order: number
          title: Json
          updated_at?: string
        }
        Update: {
          content?: Json | null
          course_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          sort_order?: number
          title?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          organization_id: number
          role: Database['public']['Enums']['role']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          organization_id: number
          role: Database['public']['Enums']['role']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          organization_id?: number
          role?: Database['public']['Enums']['role']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      organization_regions: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          organization_id: number
          region_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          organization_id: number
          region_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          organization_id?: number
          region_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_regions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_regions_region_id_fkey'
            columns: ['region_id']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          approved_at: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          description: Json | null
          email: string
          handle: string
          id: number
          name: string
          phone: string | null
          postcode: string | null
          rating: number | null
          region: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: Json | null
          email: string
          handle: string
          id?: number
          name: string
          phone?: string | null
          postcode?: string | null
          rating?: number | null
          region?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: Json | null
          email?: string
          handle?: string
          id?: number
          name?: string
          phone?: string | null
          postcode?: string | null
          rating?: number | null
          region?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      question_options: {
        Row: {
          content: Json
          created_at: string
          deleted_at: string | null
          id: number
          is_correct: boolean
          question_id: number
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_correct: boolean
          question_id: number
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_correct?: boolean
          question_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'question_options_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: Json
          explanation: Json | null
          id: number
          lesson_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: Json
          explanation?: Json | null
          id?: number
          lesson_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: Json
          explanation?: Json | null
          id?: number
          lesson_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'questions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      regions: {
        Row: {
          coordinator_id: string | null
          created_at: string
          deleted_at: string | null
          emoji: string | null
          icon_url: string | null
          id: number
          name: Json
          updated_at: string
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          icon_url?: string | null
          id?: number
          name: Json
          updated_at?: string
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          icon_url?: string | null
          id?: number
          name?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'regions_coordinator_id_fkey'
            columns: ['coordinator_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'regions_coordinator_id_fkey'
            columns: ['coordinator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      skill_groups: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          name: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          name: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          option_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          option_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          option_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_answers_option_id_fkey'
            columns: ['option_id']
            isOneToOne: false
            referencedRelation: 'question_options'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_answers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_answers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_assessments: {
        Row: {
          assessment_id: number | null
          created_at: string
          deleted_at: string | null
          id: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          assessment_id?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          assessment_id?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'user_assessments_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: false
            referencedRelation: 'assessments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_assessments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_assessments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_courses: {
        Row: {
          course_id: number
          created_at: string
          deleted_at: string | null
          id: number
          locale: Database['public']['Enums']['language']
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          locale: Database['public']['Enums']['language']
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: number
          locale?: Database['public']['Enums']['language']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_courses_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_courses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_courses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_evaluations: {
        Row: {
          created_at: string
          deleted_at: string | null
          evaluation_id: number
          id: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          evaluation_id: number
          id?: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          evaluation_id?: number
          id?: number
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'user_evaluations_evaluation_id_fkey'
            columns: ['evaluation_id']
            isOneToOne: false
            referencedRelation: 'evaluations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_evaluations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_evaluations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_lessons: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          lesson_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          lesson_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          lesson_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_lessons_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_lessons_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_lessons_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_locales: {
        Row: {
          created_at: string
          email: string
          locale: Database['public']['Enums']['language']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          locale?: Database['public']['Enums']['language']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          locale?: Database['public']['Enums']['language']
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          is_editor: boolean | null
          languages: string[] | null
          last_name: string | null
          locale: Database['public']['Enums']['locale'] | null
          phone: string | null
          pronouns: string | null
          sex: Database['public']['Enums']['sex'] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          is_editor?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          locale?: Database['public']['Enums']['locale'] | null
          phone?: string | null
          pronouns?: string | null
          sex?: Database['public']['Enums']['sex'] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_editor?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          locale?: Database['public']['Enums']['locale'] | null
          phone?: string | null
          pronouns?: string | null
          sex?: Database['public']['Enums']['sex'] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_emails: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      course_type: 'intro' | 'skill'
      language: 'es' | 'en' | 'it'
      locale: 'en' | 'es' | 'it'
      role: 'representative' | 'tutor' | 'volunteer' | 'learner'
      sex: 'female' | 'male' | 'non-binary' | 'unspecified'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      course_type: ['intro', 'skill'],
      language: ['es', 'en', 'it'],
      locale: ['en', 'es', 'it'],
      role: ['representative', 'tutor', 'volunteer', 'learner'],
      sex: ['female', 'male', 'non-binary', 'unspecified'],
    },
  },
} as const
