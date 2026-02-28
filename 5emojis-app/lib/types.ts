export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          dob: string;
          race: string | null;
          religion: string | null;
          profession: string | null;
          life_stage: string | null;
          friendship_style: string | null;
          pronouns: string | null;
          is_new_to_city: boolean;
          city: string;
          state: string | null;
          zip: string | null;
          latitude: number;
          longitude: number;
          intent: "friends" | "dating" | "both";
          search_radius_miles: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          dob: string;
          race?: string | null;
          religion?: string | null;
          profession?: string | null;
          life_stage?: string | null;
          friendship_style?: string | null;
          pronouns?: string | null;
          intent?: "friends" | "dating" | "both";
          is_new_to_city?: boolean;
          city: string;
          state?: string | null;
          zip?: string | null;
          latitude: number;
          longitude: number;
          search_radius_miles?: number;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      profile_emojis: {
        Row: {
          id: string;
          user_id: string;
          emoji: string;
          position: number;
        };
        Insert: {
          user_id: string;
          emoji: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["profile_emojis"]["Insert"]>;
        Relationships: [];
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          position: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          url: string;
          position: number;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profile_photos"]["Insert"]>;
        Relationships: [];
      };
      profile_interests: {
        Row: {
          id: string;
          user_id: string;
          interest_tag: string;
        };
        Insert: {
          user_id: string;
          interest_tag: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_interests"]["Insert"]>;
        Relationships: [];
      };
      profile_languages: {
        Row: {
          id: string;
          user_id: string;
          language: string;
        };
        Insert: {
          user_id: string;
          language: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_languages"]["Insert"]>;
        Relationships: [];
      };
      profile_reveals: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          position: number;
        };
        Insert: {
          user_id: string;
          content: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["profile_reveals"]["Insert"]>;
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          swiper_id: string;
          swiped_id: string;
          direction: "right" | "left";
          created_at: string;
        };
        Insert: {
          swiper_id: string;
          swiped_id: string;
          direction: "right" | "left";
        };
        Update: Partial<Database["public"]["Tables"]["swipes"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          emoji_match_count: number;
          is_emoji_perfect: boolean;
          created_at: string;
        };
        Insert: {
          user1_id: string;
          user2_id: string;
          emoji_match_count?: number;
          is_emoji_perfect?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          is_emoji_only: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          match_id: string;
          sender_id: string;
          content: string;
          is_emoji_only?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocks"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          reported_id: string;
          reason: string;
          details?: string | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      ai_content: {
        Row: {
          id: string;
          content: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          content: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["ai_content"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      nearby_profiles: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_miles: number;
          current_user_id: string;
          intent_filter?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileEmoji = Database["public"]["Tables"]["profile_emojis"]["Row"];
export type ProfilePhoto = Database["public"]["Tables"]["profile_photos"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
