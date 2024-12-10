import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/S_and_Y_logo_50_vectorized.png';

function Navbar({ isAdmin, isManager, isAuthenticated }) {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        window.location.reload();
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between">
                    <div className="flex space-x-7">
                        <div className="flex items-center py-2">
                            <Link to="/" className="flex items-center">
                                <img src={logo} alt="S and Y Industries" className="h-12" />
                            </Link>
                        </div>
                        <div className="flex items-center py-4 px-2">
                            <Link to="/" className="text-gray-800 text-lg font-semibold">
                                ESD Testing
                            </Link>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Link to="/" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                Home
                            </Link>
                            <Link to="/daily-log" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                Daily Log
                            </Link>
                            {(isAdmin || isManager) && (
                                <Link to="/history" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                    History
                                </Link>
                            )}
                            {(isAdmin || isManager) && (
                                <Link to="/absences" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                    Absences
                                </Link>
                            )}
                            {isAdmin && (
                                <>
                                    <Link to="/users" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                        Users
                                    </Link>
                                    <Link to="/register" className="py-4 px-2 text-gray-500 hover:text-gray-900">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {!isAuthenticated ? (
                            <Link
                                to="/login"
                                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                            >
                                Manager/Admin Login
                            </Link>
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
    );
}

export default Navbar;