import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LogoutButton } from "./LogoutButton";
import { GoogleLoginButton } from "./GoogleLoginButton";
import genericProfilePic from "./../assets/generic-profile-p.jpg"

export const TopBar = () => {
  const { user } = useAuth();
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
            <Link to={`/profile/${user.username}`}>
              <img
                src={user.profilePic || genericProfilePic}
                alt={user.displayName}
                className="avatar"
              />
            </Link>
            <LogoutButton />
          </>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </nav>
  );
};