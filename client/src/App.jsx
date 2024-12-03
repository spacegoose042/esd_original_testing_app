import api from './config/axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import { useState, useEffect } from 'react';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem('token')) {
          console.log('Checking admin status...');
          const response = await api.get('/auth/verify');
          if (response.status !== 200) {
            throw new Error(`Verification failed: ${response.status} ${response.statusText}`);
          }
          console.log('Admin status response:', response.data);
          setIsAdmin(response.data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error verifying admin status:', err);
        localStorage.removeItem('token');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdmin(false);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between">
              <div className="flex space-x-7">
                <div className="flex items-center py-4 px-2">
                  <Link to="/" className="text-gray-800 text-lg font-semibold">ESD Testing</Link>
                </div>
                <div className="flex items-center space-x-1">
                  <Link to="/" className="py-4 px-2 text-gray-500 hover:text-gray-900">Home</Link>
                  <Link to="/history" className="py-4 px-2 text-gray-500 hover:text-gray-900">History</Link>
                  {/* Debug log */}
                  {console.log('Rendering nav, isAdmin:', isAdmin)}
                  {isAdmin && (
                    <>
                      <Link to="/users" className="py-4 px-2 text-gray-500 hover:text-gray-900">Users</Link>
                      <Link to="/register" className="py-4 px-2 text-gray-500 hover:text-gray-900">Register</Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {!localStorage.getItem('token') ? (
                  <Link to="/login" className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">Admin Login</Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;