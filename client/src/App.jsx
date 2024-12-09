import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import DailyLog from './pages/DailyLog';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="py-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/daily-log" element={<DailyLog />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;