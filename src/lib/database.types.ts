// 与 supabase/migrations/*.sql 对应。
// 建好项目后可用 `pnpm dlx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts` 重新生成。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      interviews: {
        Row: {
          id: string
          client: string
          vendor: string
          interviewee: string
          interviewer: string
          interview_type: string
          received_at: string | null
          interview_at: string | null
          jd: Json | null
          jd_rev: number
          materials: Json | null
          materials_rev: number
          questions: Json | null
          questions_rev: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client?: string
          vendor?: string
          interviewee?: string
          interviewer?: string
          interview_type?: string
          received_at?: string | null
          interview_at?: string | null
          jd?: Json | null
          jd_rev?: number
          materials?: Json | null
          materials_rev?: number
          questions?: Json | null
          questions_rev?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client?: string
          vendor?: string
          interviewee?: string
          interviewer?: string
          interview_type?: string
          received_at?: string | null
          interview_at?: string | null
          jd?: Json | null
          jd_rev?: number
          materials?: Json | null
          materials_rev?: number
          questions?: Json | null
          questions_rev?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      ping: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
