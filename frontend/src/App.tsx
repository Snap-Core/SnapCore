import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage/HomePage";
import { CreatePost } from "./pages/CreatePost/CreatePost";
import { Feed } from "./pages/Feed/Feed";
import { PageNotFound } from "./pages/PageNotFound/PageNotFound";
import { UserProfile } from "./pages/UserProfile/UserProfile";
import "./App.css";

export const App = () => (
  <Router>
    <nav className="navbar">
      <Link to="/" style={{ marginRight: 16 }}>Home</Link>
      <Link to="/feed" style={{ marginRight: 16 }}>Feed</Link>
      <Link to="/create-post" style={{ marginRight: 16 }}>Create Post</Link>
    </nav>
    <div className="page-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/welcome" element={<HomePage />} />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:username" element={<UserProfile />} />
      </Routes>
    </div>
  </Router>
);