export type Gender = "male" | "female";
export type RequestStatus = "pending" | "accepted" | "declined";
export type VerificationStatus = "verified" | "rejected";
export type VerificationMethod = "college_email" | "admission_pdf";

/** Quiz answers keyed by question id (see lib/quiz.ts). */
export type QuizAnswers = Record<string, string | number | boolean>;

export interface Profile {
  user_id: string;
  gender: Gender;
  name: string;
  year_of_study: number;
  location: string;
  phone_number: string;
  bio: string;
  interests: string[];
  /** Storage paths in the private profile-photos bucket, served via /api/photos. */
  photo_urls: string[];
  quiz_answers: QuizAnswers;
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

export interface Verification {
  user_id: string;
  status: VerificationStatus;
  method: VerificationMethod;
  admission_number: string | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  attempts: number;
  reason: string | null;
  created_at: string;
  updated_at: string;
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
      verifications: {
        Row: Verification;
        Insert: Partial<Verification> & Pick<Verification, "user_id" | "status" | "method">;
        Update: Partial<Verification>;
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
      is_verified: {
        Args: { uid: string };
        Returns: boolean;
      };
      can_like: {
        Args: { target: string };
        Returns: boolean;
      };
      get_match_phone_number: {
        Args: { other_user_id: string };
        Returns: string | null;
      };
    };
  };
}
