import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import DailyLog from './pages/DailyLog';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Login from './pages/Login';
import Users from './pages/Users';
import api from './services/api';

function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                setIsAuthenticated(false);
                return;
            }

            try {
                const response = await api.get('/auth/verify');
                console.log('Auth verification response:', response.data);
                setIsAdmin(response.data.isAdmin);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth verification error:', error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                }
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    // Protected Route component
    const ProtectedRoute = ({ children, adminOnly = false }) => {
        if (!isAuthenticated && adminOnly) {
            return <Navigate to="/login" />;
        }
        if (adminOnly && !isAdmin) {
            return <Navigate to="/" />;
        }
        return children;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
            <div className="py-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/daily-log" element={<DailyLog />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/login" element={
                        isAuthenticated ? 
                        <Navigate to="/" /> : 
                        <Login setIsAdmin={setIsAdmin} />
                    } />
                    <Route path="/users" element={
                        <ProtectedRoute adminOnly>
                            <Users />
                        </ProtectedRoute>
                    } />
                    <Route path="/register" element={
                        <ProtectedRoute adminOnly>
                            <Register />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;