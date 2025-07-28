import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PageNotFound } from './pages/PageNotFound';
import { HomePage } from './pages/HomePage/HomePage';

export const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/welcome" element={<HomePage />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    </Router>
);