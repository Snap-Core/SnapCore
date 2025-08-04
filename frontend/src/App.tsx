import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage/HomePage";
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
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="*" element={<PageNotFound />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </div>
    </AuthProvider>
  </Router>
);
