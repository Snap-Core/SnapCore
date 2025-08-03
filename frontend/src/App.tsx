import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage/HomePage";
import { CreatePost } from "./pages/CreatePost/CreatePost";
import { Feed } from "./pages/Feed/Feed";
import { PageNotFound } from "./pages/PageNotFound/PageNotFound";
import { AuthProvider } from "./auth/AuthProvider";
import { PrivateRoute } from "./auth/PrivateRoute";

import { useAuth } from "./auth/useAuth";
import { GoogleLoginButton } from "./components/GoogleLoginButton";
import { LogoutButton } from "./components/LogoutButton";
import { UserProfile } from "./pages/UserProfile/UserProfile";
import "./App.css";
import genericProfilePic from "../src/assets/generic-profile-p.jpg"
import { useState } from "react";

type TopBarProps = {
  onFeedClick: () => void;
};
const TopBar: React.FC<TopBarProps> = ({ onFeedClick }) => {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div>
        <Link to="/" style={{ marginRight: 16 }}>Home</Link>
        <Link to="/feed" onClick={onFeedClick} style={{ marginRight: 16 }}>Feed</Link>
        <Link to="/create-post" style={{ marginRight: 16 }}>Create Post</Link>
      </div>
      {/* {user ? <LogoutButton /> : <GoogleLoginButton />} */}
      <div className="nav-right">
        {user ? (
          <>
            <Link to={`/profile/${user.username}`}>
              <img
                src={user.profilePic || genericProfilePic}
                alt={user.name}
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

export const App = () => {
  const [feedReloadKey, setFeedReloadKey] = useState(0);

  const handleFeedClick = () => {
    setFeedReloadKey((prev) => prev + 1);
  };

  return (
    <AuthProvider>
      <Router>
        <TopBar onFeedClick={handleFeedClick} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<Feed reloadKey={feedReloadKey} />} />
            <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
            <Route path="*" element={<PageNotFound />} />
            <Route path="/profile/:username" element={<UserProfile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};