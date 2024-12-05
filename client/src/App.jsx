import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Users from './pages/Users';
import api from './services/api';

function App() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/verify');
                console.log('Auth verification response:', response.data);
                setIsAdmin(response.data.isAdmin);
            } catch (error) {
                console.error('Auth verification error:', error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar isAdmin={isAdmin} />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login setIsAdmin={setIsAdmin} />} />
                    <Route path="/history" element={<History />} />
                    {isAdmin && (
                        <>
                            <Route path="/register" element={<Register />} />
                            <Route path="/users" element={<Users />} />
                        </>
                    )}
                </Routes>
            </main>
        </div>
    );
}

export default App;