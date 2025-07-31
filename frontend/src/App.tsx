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

const TopBar = () => {
  const { user } = useAuth();
  return (
    <nav style={{ padding: "1rem", background: "#fff", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <Link to="/" style={{ marginRight: 16 }}>Home</Link>
        <Link to="/feed" style={{ marginRight: 16 }}>Feed</Link>
        <Link to="/create-post" style={{ marginRight: 16 }}>Create Post</Link>
      </div>
      {user ? <LogoutButton /> : <GoogleLoginButton />}
    </nav>
  );
};

export const App = () => (
  <AuthProvider>
    <Router>
      <TopBar />
      <div className="page-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="*" element={<PageNotFound />} />
          <Route path="/profile/:username" element={<UserProfile />} />
      </Routes>
      </div>
  </Router>
  </AuthProvider>
);