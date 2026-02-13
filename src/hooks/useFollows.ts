import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface FollowUser {
  id: number;
  username: string;
  avatar: string | null;
}

export function useFollows(type: "following" | "followers", enabled: boolean = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["follows", type],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`/api/user/follows?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch follows");
      }
      return res.json() as Promise<FollowUser[]>;
    },
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
