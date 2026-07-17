// Гараар бичсэн эхлэл. Бодит төсөлд:
//   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.types.ts
// ашиглан үүнийг автоматаар шинэчлэхийг зөвлөж байна.
//
// @supabase/postgrest-js-ийн GenericTable/GenericSchema нь Row/Insert/Update-ээс
// гадна заавал Relationships талбартай, мөн схем нь Tables-ийн зэрэгцээ Views,
// Functions талбартай байхыг шаарддаг (GenericSchema constraint). Эдгээрийг
// орхивол TypeScript Database generic-ийг барьж чадахгүй, бүх .insert()/.select()
// дуудлага чимээгүйгээр "never" болж, `next build`-ийг блоклодог байсан.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "student" | "instructor" | "admin";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          thumbnail_url: string | null;
          price: number;
          is_published: boolean;
          instructor_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          position: number;
        };
        Insert: Partial<Database["public"]["Tables"]["modules"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["modules"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          content_text: string | null;
          mux_playback_id: string | null;
          mux_asset_id: string | null;
          image_url: string | null;
          duration_seconds: number | null;
          position: number;
          is_free_preview: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enrollments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          is_completed: boolean;
          last_position_seconds: number;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_usage_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ai_usage_logs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
  };
};
