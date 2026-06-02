import { useAuth } from "./useAuth";

// Single hardcoded admin user — always admin when logged in.
export const useUserRole = () => {
  const { isAuthenticated } = useAuth();
  return {
    role: isAuthenticated ? ("admin" as const) : null,
    loading: false,
    isAdmin: isAuthenticated,
    isModerator: isAuthenticated,
    isUser: isAuthenticated,
  };
};
