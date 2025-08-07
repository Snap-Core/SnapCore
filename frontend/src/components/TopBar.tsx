import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LogoutButton } from "./LogoutButton";
import { GoogleLoginButton } from "./GoogleLoginButton";
import genericProfilePic from "./../assets/generic-profile-p.jpg"
import { URLS } from "../enums/urls";

export const TopBar = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <nav className="navbar">
        <div>
          <Link to="/" style={{ marginRight: 16 }}>Discover</Link>
          <Link to="/feed" style={{ marginRight: 16 }}>Feed</Link>
          <Link to="/create-post" style={{ marginRight: 16 }}>Create Post</Link>
        </div>
        <div className="nav-right">
          <div style={{ padding: '8px 16px' }}>Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div>
        <Link to="/" style={{ marginRight: 16 }}>Discover</Link>
        <Link to="/feed" style={{ marginRight: 16 }}>Feed</Link>
        <Link to="/create-post" style={{ marginRight: 16 }}>Create Post</Link>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <Link to={`/profile/${user.username ?? 'user-activation'}`}>
              <img
                src={`${URLS.API_HOST}${user.profilePic || genericProfilePic}`}
                alt={user.displayName || user.username}
                className="avatar"
              />
            </Link>
            <span style={{ marginRight: 8, fontSize: '14px' }}>
              {user.displayName || user.username}
            </span>
            
            <LogoutButton />
          </>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </nav>
  );
};