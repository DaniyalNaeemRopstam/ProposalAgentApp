export { useAuth, type AuthUser as User } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";

/** @deprecated Prefer `useAuth()` for `/me` shape; kept for callers expecting React Query ergonomics */
export function useMe() {
  const a = useAuth();
  return {
    data: a.user,
    isLoading: a.isLoading,
    isError: false as const,
    error: null as Error | null,
    refetch: a.refreshUser,
  };
}
