import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { DiscoverPage } from "./pages/DiscoverPage/DiscoverPage";
import { CreatePost } from "./pages/CreatePost/CreatePost";
import { Feed } from "./pages/Feed/Feed";
import { PageNotFound } from "./pages/PageNotFound/PageNotFound";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { AuthProvider } from "./auth/AuthProvider";
import { PrivateRoute } from "./auth/PrivateRoute";
import { UserProfile } from "./pages/UserProfile/UserProfile";
import "./App.css";
import { TopBar } from "./components/TopBar";
import { FollowProvider } from "./components/FollowContext";
import { ToastProvider } from "./components/ToastContext";
import { PostDetailsPage } from "./pages/PostDetails/PostDetailsPage";

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {!isLoginPage && <TopBar />}
      <div className="page-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DiscoverPage /></PrivateRoute>} />
          <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/profile/:username" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><PostDetailsPage /></PrivateRoute>} />
          <Route path="/user-activation" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </>
  );
};

export const App = () => (
  <Router>
    <ToastProvider>
      <FollowProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FollowProvider>
    </ToastProvider>
  </Router>
);
