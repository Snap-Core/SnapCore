import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DiscoverPage } from "./pages/DiscoverPage/DiscoverPage";
import { CreatePost } from "./pages/CreatePost/CreatePost";
import { Feed } from "./pages/Feed/Feed";
import { PageNotFound } from "./pages/PageNotFound/PageNotFound";
import { AuthProvider } from "./auth/AuthProvider";
import { PrivateRoute } from "./auth/PrivateRoute";
import { UserProfile } from "./pages/UserProfile/UserProfile";
import "./App.css";
import { TopBar } from "./components/TopBar";

export const App = () => (
  <Router>
    <AuthProvider>
      <TopBar />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/profile/:username" element={<UserProfile />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  </Router>
);
