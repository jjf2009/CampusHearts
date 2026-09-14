export type Gender = "male" | "female";
export type RequestStatus = "pending" | "accepted" | "declined";

export interface Profile {
  user_id: string;
  gender: Gender;
  name: string;
  year_of_study: number;
  location: string;
  phone_number: string;
  bio: string;
  interests: string[];
  photo_urls: string[];
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicProfile = Omit<Profile, "phone_number">;

export interface LoveRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { user_id: string; gender: Gender };
        Update: Partial<Profile>;
      };
      love_requests: {
        Row: LoveRequest;
        Insert: Pick<LoveRequest, "sender_id" | "receiver_id">;
        Update: Partial<Pick<LoveRequest, "status" | "responded_at">>;
      };
    };
    Views: {
      profiles_public: {
        Row: PublicProfile;
      };
    };
    Functions: {
      current_user_gender: {
        Args: Record<string, never>;
        Returns: Gender;
      };
      get_match_phone_number: {
        Args: { other_user_id: string };
        Returns: string | null;
      };
    };
  };
}
