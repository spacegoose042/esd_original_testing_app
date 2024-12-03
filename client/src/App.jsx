import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Users from './pages/Users';
import api from './services/api';

function App() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/verify')
                .then(response => {
                    setIsAdmin(response.data.isAdmin);
                })
                .catch(error => {
                    console.error('Auth verification error:', error);
                    localStorage.removeItem('token');
                });
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar isAdmin={isAdmin} />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/" element={<History />} />
                    <Route path="/login" element={<Login />} />
                    {isAdmin && (
                        <>
                            <Route path="/register" element={<Register />} />
                            <Route path="/users" element={<Users />} />
                        </>
                    )}
                    <Route path="/history" element={<History />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;