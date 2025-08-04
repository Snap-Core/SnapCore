import React from 'react';
import { fetcher } from '../utils/fetcher';
import type { User } from '../types/User';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom'; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate(); 

  React.useEffect(() => {
    fetcher('/users/me')
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await fetcher('/users/logout', { method: 'POST' });
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};