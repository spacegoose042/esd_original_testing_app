import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import DailyLog from './pages/DailyLog';
import Register from './pages/Register';
import Login from './pages/Login';
import Users from './pages/Users';
import api from './services/api';

function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
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
                setIsManager(response.data.isManager);
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

    // If not authenticated, only show login
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={
                    <Login 
                        setIsAdmin={setIsAdmin} 
                        setIsManager={setIsManager} 
                        setIsAuthenticated={setIsAuthenticated}
                    />
                } />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    // Protected Route component for admin/manager specific routes
    const ProtectedRoute = ({ children, adminOnly = false, managerOrAdmin = false }) => {
        if (adminOnly && !isAdmin) {
            return <Navigate to="/" />;
        }
        if (managerOrAdmin && !isAdmin && !isManager) {
            return <Navigate to="/" />;
        }
        return children;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar isAdmin={isAdmin} isManager={isManager} isAuthenticated={isAuthenticated} />
            <div className="py-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/daily-log" element={<DailyLog />} />
                    <Route path="/history" element={
                        <ProtectedRoute managerOrAdmin>
                            <History />
                        </ProtectedRoute>
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