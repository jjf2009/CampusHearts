import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export const metadata = { title: "Account banned" };

export default function BannedPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <LogoMark size={56} />
      <div className="sketch mt-6 p-6">
        <h1 className="font-display text-5xl">Account banned</h1>
        <p className="mt-3 text-lg">
          This account broke the Campus Buddy community rules and can no longer use the site.
        </p>
        <p className="mt-3 text-muted">
          Think this is a mistake? Email the organisers from the address you signed up with.
        </p>
        <Link href="/safety" className="mt-5 inline-block underline">
          Read the community rules
        </Link>
      </div>
    </div>
  );
}
