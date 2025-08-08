import { useAuth } from "../auth/useAuth";

import { LogOut } from 'lucide-react';

type LogoutButtonProps = {
  className?: string;
};

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  const { logout } = useAuth();

  return (
    <button onClick={logout} className={`logout-button ${className ?? ''}`}>
      <LogOut size={18} style={{ marginRight: 8 }} />
      Log out
    </button>
  );
};