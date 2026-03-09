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
          gender: "male" | "female" | "nonbinary";
          personality_type: string | null;
          preferred_age_min: number | null;
          preferred_age_max: number | null;
          communication_style: string | null;
          kids: string | null;
          relationship_status: string | null;
          work_style: string | null;
          emoji_last_edited_at: string | null;
          push_token: string | null;
          search_radius_miles: number;
          is_suspended: boolean;
          suspended_at: string | null;
          suspended_until: string | null;
          suspension_reason: string | null;
          is_premium: boolean;
          premium_until: string | null;
          revenucat_customer_id: string | null;
          hidden_emojis: string[];
          is_admin: boolean;
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
          gender?: "male" | "female" | "nonbinary";
          personality_type?: string | null;
          preferred_age_min?: number | null;
          preferred_age_max?: number | null;
          communication_style?: string | null;
          kids?: string | null;
          relationship_status?: string | null;
          work_style?: string | null;
          emoji_last_edited_at?: string | null;
          push_token?: string | null;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_until?: string | null;
          suspension_reason?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
          revenucat_customer_id?: string | null;
          hidden_emojis?: string[];
          is_admin?: boolean;
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
          is_super_like: boolean;
          created_at: string;
        };
        Insert: {
          swiper_id: string;
          swiped_id: string;
          direction: "right" | "left";
          is_super_like?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["swipes"]["Insert"]>;
        Relationships: [];
      };
      daily_swipe_counts: {
        Row: {
          id: string;
          user_id: string;
          swipe_date: string;
          right_count: number;
          super_like_count: number;
        };
        Insert: {
          user_id: string;
          swipe_date: string;
          right_count?: number;
          super_like_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["daily_swipe_counts"]["Insert"]>;
        Relationships: [];
      };
      super_likes: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          created_at: string;
        };
        Insert: {
          sender_id: string;
          receiver_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["super_likes"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          emoji_match_count: number;
          is_emoji_perfect: boolean;
          icebreaker_question_id: string | null;
          created_at: string;
        };
        Insert: {
          user1_id: string;
          user2_id: string;
          emoji_match_count?: number;
          is_emoji_perfect?: boolean;
          icebreaker_question_id?: string | null;
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
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]> & {
          read_at?: string | null;
        };
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
      icebreaker_questions: {
        Row: {
          id: string;
          question: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          question: string;
          category?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["icebreaker_questions"]["Insert"]>;
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
      profile_availability: {
        Row: {
          id: string;
          user_id: string;
          slot: string;
        };
        Insert: {
          user_id: string;
          slot: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_availability"]["Insert"]>;
        Relationships: [];
      };
      profile_pets: {
        Row: {
          id: string;
          user_id: string;
          pet: string;
        };
        Insert: {
          user_id: string;
          pet: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_pets"]["Insert"]>;
        Relationships: [];
      };
      profile_dietary: {
        Row: {
          id: string;
          user_id: string;
          preference: string;
        };
        Insert: {
          user_id: string;
          preference: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_dietary"]["Insert"]>;
        Relationships: [];
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_reactions"]["Insert"]>;
        Relationships: [];
      };
      error_logs: {
        Row: {
          id: string;
          user_id: string | null;
          error_message: string;
          error_stack: string | null;
          component_stack: string | null;
          screen: string | null;
          platform: string | null;
          app_version: string | null;
          extra: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          error_message: string;
          error_stack?: string | null;
          component_stack?: string | null;
          screen?: string | null;
          platform?: string | null;
          app_version?: string | null;
          extra?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["error_logs"]["Insert"]>;
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
          gender_filter?: string | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
      reset_mock_data: {
        Args: {
          requesting_user_id: string;
        };
        Returns: unknown;
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
export type IcebreakerQuestion = Database["public"]["Tables"]["icebreaker_questions"]["Row"];
export type ProfileAvailability = Database["public"]["Tables"]["profile_availability"]["Row"];
export type ProfilePet = Database["public"]["Tables"]["profile_pets"]["Row"];
export type ProfileDietary = Database["public"]["Tables"]["profile_dietary"]["Row"];
export type MessageReaction = Database["public"]["Tables"]["message_reactions"]["Row"];
