import { Navigate } from 'react-router-dom';
import type React from 'react';
import { useAuth } from './useAuth';
import { Loading } from '../components/Loading';

export const PrivateRoute = ({ children }: { children: React.JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  if (user && user.activated === false) {
    return <Navigate to='/user-activation' replace />;
  }

  return children;
};