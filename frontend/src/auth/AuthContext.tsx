import React from 'react';
import type { AuthContextType } from '../types/AuthContextType.ts';

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});