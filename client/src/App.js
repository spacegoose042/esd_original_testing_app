import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex space-x-4 items-center">
                <Link to="/" className="text-gray-800 hover:text-gray-600">
                  Home
                </Link>
                <Link to="/history" className="text-gray-800 hover:text-gray-600">
                  History
                </Link>
              </div>
              <div className="flex space-x-4 items-center">
                <Link to="/login" className="text-gray-800 hover:text-gray-600">
                  Login
                </Link>
                <Link to="/register" className="text-gray-800 hover:text-gray-600">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;