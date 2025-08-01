import { useAuth } from "../auth/useAuth";

export const LogoutButton = () => {
  const { logout } = useAuth();
  return (
    <button onClick={logout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
      Log out
    </button>
  );
};