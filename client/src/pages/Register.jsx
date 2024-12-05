import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        manager_id: '',
        department_id: '',
        is_manager: false
    });
    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [managersRes, departmentsRes] = await Promise.all([
                    api.get('/users/managers'),
                    api.get('/users/departments')
                ]);
                setManagers(managersRes.data);
                setDepartments(departmentsRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load required data');
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Submitting registration:', formData);
            
            const response = await api.post('/users', formData);
            console.log('Registration successful:', response.data);
            
            navigate('/users');
        } catch (err) {
            console.error('Registration error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            
            setError(
                err.response?.data?.details || 
                err.response?.data?.error || 
                'Failed to register user'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Register New User</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                    </label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                    </label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                    </label>
                    <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manager
                    </label>
                    <select
                        name="manager_id"
                        value={formData.manager_id}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Manager</option>
                        {managers.map(manager => (
                            <option key={manager.id} value={manager.id}>
                                {manager.first_name} {manager.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_manager"
                        checked={formData.is_manager}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                        Is this user a manager?
                    </label>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Registering...' : 'Register User'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Register;