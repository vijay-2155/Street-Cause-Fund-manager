import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentMember } from "@/lib/supabase/helpers";
import { useRouter } from "next/navigation";
import type { Member } from "@/types";

interface UseCurrentMemberReturn {
  member: Member | null;
  user: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to safely get current member with automatic error handling and redirect
 */
export function useCurrentMember(): UseCurrentMemberReturn {
  const [member, setMember] = useState<Member | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getCurrentMember(supabase);

        if (!result) {
          setError("Unable to load profile");
          // Redirect to unauthorized page
          router.push("/unauthorized");
          return;
        }

        setMember(result.member);
        setUser(result.user);
      } catch (err: any) {
        console.error("useCurrentMember error:", err);
        setError(err.message || "Failed to load profile");

        // Redirect to unauthorized for specific errors
        if (
          err.message?.includes("Member profile not found") ||
          err.message?.includes("inactive")
        ) {
          router.push("/unauthorized");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, []);

  return { member, user, loading, error };
}
