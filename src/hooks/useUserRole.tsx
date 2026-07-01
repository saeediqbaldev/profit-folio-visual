import { useAuth } from "./useAuth";

export const useUserRole = () => {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || null;
  const isAdmin = isAuthenticated && role === "admin";
  return {
    role,
    loading: false,
    isAdmin,
    isModerator: isAdmin,
    isUser: isAuthenticated,
  };
};
