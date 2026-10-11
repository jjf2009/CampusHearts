import type { RankedProfile } from "@/components/explore/ExploreDeck";
import type { LikeRow } from "@/components/likes/LikesList";
import type { Match, Message } from "@/lib/supabase/types";

// Entirely made-up people for the dev preview.
export const MOCK_ME = { id: "00000000-0000-4000-8000-000000000000", email: "preview@example.com" };

const names = ["Aisha", "Rhea", "Sana", "Tanya", "Neha", "Kavya", "Ira", "Mira"];
const places = ["Panaji", "Margao", "Mapusa", "Vasco", "Ponda", "Panaji", "Calangute", "Quepem"];
const branches = ["Computer", "IT", "Civil", "Mechanical", "E&TC", "Computer", "VLSI", "IT"];

export function mockProfiles(): RankedProfile[] {
  return names.map((name, i) => ({
    user_id: `00000000-0000-4000-8000-00000000000${i + 1}`,
    gender: "female",
    name,
    year_of_study: 1 + (i % 4),
    location: places[i],
    bio: i % 2 ? "Here for the music, the food and good company." : "Chai > coffee. Fight me.",
    interests: ["music", "football", "anime"].slice(0, 1 + (i % 3)),
    photo_urls: [`00000000-0000-4000-8000-00000000000${i + 1}/0-1.bin`],
    quiz_answers: {},
    is_complete: true,
    age: 18 + (i % 4),
    branch: branches[i],
    religion: null,
    height_cm: null,
    languages: ["Konkani", "English"],
    here_for: i % 3 === 0 ? "friends" : "both",
    interested_in: "men",
    last_active_at: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    discover_kinds: i % 3 === 0 ? ["friends"] : ["dating", "friends"],
    compatibility: { score: 94 - i * 6, shared: ["🪩 Dance all night", "🎬 Bollywood bangers"] },
    fitsPrefs: i < 5,
    likesYou: i === 1,
  }));
}

export function mockLikes(): { received: LikeRow[]; sent: LikeRow[] } {
  const p = mockProfiles();
  return {
    received: [
      { id: "l1", kind: "dating", created_at: "2026-10-10T10:00:00Z", incoming: true, person: p[1] },
      { id: "l2", kind: "friends", created_at: "2026-10-09T10:00:00Z", incoming: true, person: p[3] },
    ],
    sent: [{ id: "l3", kind: "dating", created_at: "2026-10-08T10:00:00Z", incoming: false, person: p[2] }],
  };
}

export function mockChat() {
  const person = mockProfiles()[1];
  const match: Match = {
    id: "00000000-0000-4000-8000-0000000000aa",
    user_a: MOCK_ME.id,
    user_b: person.user_id,
    kind: "dating",
    created_at: "2026-10-10T09:00:00Z",
    unmatched_at: null,
    unmatched_by: null,
    a_shared_phone: false,
    b_shared_phone: true,
    last_message_at: null,
  };
  const msg = (i: number, mine: boolean, body: string): Message => ({
    id: `m${i}`,
    match_id: match.id,
    sender_id: mine ? MOCK_ME.id : person.user_id,
    body,
    created_at: new Date(Date.UTC(2026, 9, 10, 9, i * 3)).toISOString(),
    read_at: mine ? "2026-10-10T10:00:00Z" : null,
  });
  return {
    me: MOCK_ME.id,
    match,
    person,
    theirPhone: "+91 90000 00000",
    iShared: false,
    initialMessages: [
      msg(1, false, "Hiii! Saw you're in Computer too 👋"),
      msg(2, true, "Haha yes! Which division are you in?"),
      msg(3, false, "B! Are you going to the freshers night?"),
      msg(4, true, "Definitely. Need someone to dance with 😄"),
    ],
  };
}
