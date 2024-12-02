import { Link } from 'react-router-dom';

function Navbar({ isAdmin }) {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="text-white hover:text-gray-300">Home</Link>
          <Link to="/history" className="text-white hover:text-gray-300">History</Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/login" className="text-white hover:text-gray-300">Admin Login</Link>
          {isAdmin && (
            <Link to="/register" className="text-white hover:text-gray-300">
              Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;