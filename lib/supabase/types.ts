// Row types for the tables and views in supabase/migrations.

export type Gender = "male" | "female";
export type RequestStatus = "pending" | "accepted" | "declined";
export type VerificationStatus = "verified" | "rejected" | "pending_review" | "banned";
export type VerificationMethod = "college_email" | "admission_pdf" | "card_review";
export type HereFor = "dating" | "friends" | "both";
export type InterestedIn = "men" | "women" | "everyone";
export type LikeKind = "dating" | "friends";
export type ReportReason =
  | "fake_profile"
  | "harassment"
  | "inappropriate_photos"
  | "spam"
  | "underage"
  | "other";

/** Quiz answers and partner preferences keyed by id (see lib/quiz.ts). */
export type QuizAnswers = Record<string, string | number | boolean | string[] | number[]>;

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
  age: number | null;
  branch: string | null;
  religion: string | null;
  height_cm: number | null;
  languages: string[];
  here_for: HereFor;
  interested_in: InterestedIn | null;
  is_paused: boolean;
  last_active_at: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

/** profiles_public: what other students can see. No phone number, no pause flag. */
export type PublicProfile = Omit<Profile, "phone_number" | "is_paused"> & {
  /** How the viewer can meet this person: dating, friends, or both. */
  discover_kinds: LikeKind[];
};

export interface LoveRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  kind: LikeKind;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  kind: LikeKind;
  created_at: string;
  unmatched_at: string | null;
  unmatched_by: string | null;
  a_shared_phone: boolean;
  b_shared_phone: boolean;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface Verification {
  user_id: string;
  status: VerificationStatus;
  method: VerificationMethod;
  reg_no: string | null;
  card_name: string | null;
  card_dob: string | null;
  card_gender: Gender | null;
  card_branch: string | null;
  gec_email: string | null;
  proof_kind: "pdf" | "photo" | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  attempts: number;
  reason: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string;
  status: "open" | "actioned" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}
