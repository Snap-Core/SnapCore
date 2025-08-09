import { useAuth } from "../../auth/useAuth";
import { Navigate } from "react-router-dom";
import { GoogleLoginButton } from "../../components/GoogleLoginButton";
import { Loading } from "../../components/Loading";
import "./LoginPage.css";

export const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to SnapCore</h1>
          <p>Sign in to continue</p>
        </div>
        <div className="login-content">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
};
