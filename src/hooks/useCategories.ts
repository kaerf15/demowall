import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types";

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 24 * 60 * 60 * 1000, // Categories rarely change, cache for 24 hours
  });
}
