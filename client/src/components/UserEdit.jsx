import { useState, useEffect } from 'react';
import api from '../services/api';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerId: '',
        isAdmin: false,
        isActive: false,
        exemptFromTesting: false
    });
    const [managers, setManagers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await api.get('/users/managers');
                setManagers(response.data);
            } catch (err) {
                console.error('Error fetching managers:', err);
            }
        };

        fetchManagers();
    }, []);

    useEffect(() => {
        if (userId) {
            const fetchUser = async () => {
                try {
                    const response = await api.get(`/users/${userId}`);
                    console.log('Raw user data:', response.data);
                    
                    const userData = {
                        firstName: response.data.first_name,
                        lastName: response.data.last_name,
                        managerId: response.data.manager_id || '',
                        isAdmin: response.data.is_admin === true,
                        isActive: response.data.is_active === true,
                        exemptFromTesting: response.data.exempt_from_testing === true
                    };
                    console.log('Processed form data:', userData);
                    setFormData(userData);
                } catch (err) {
                    console.error('Error fetching user:', err);
                    setError(err.response?.data?.error || 'Failed to load user data');
                }
            };
            fetchUser();
        }
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                managerId: formData.managerId,
                isAdmin: formData.isAdmin,
                isActive: formData.isActive,
                exemptFromTesting: formData.exemptFromTesting
            };

            console.log('Submitting update:', updateData);
            const response = await api.put(`/users/${userId}`, updateData);
            console.log('Update response:', response.data);

            setSuccess('User updated successfully');
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.error || 'Failed to update user');
        }
    };

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        console.log('Field change:', { name, type, newValue });
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    console.log('Current form data:', formData);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                        Edit User
                    </h2>
                    <form className="mt-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                                {success}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">Manager</label>
                                <select
                                    id="managerId"
                                    name="managerId"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.managerId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select a manager</option>
                                    {managers.map(manager => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.first_name} {manager.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex items-center">
                                    <input
                                        id="isAdmin"
                                        name="isAdmin"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={formData.isAdmin}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                                        Is Admin
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="isActive"
                                        name="isActive"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                        Is Active
                                    </label>
                                </div>

                                <div className="flex items-center border-t pt-3">
                                    <input
                                        id="exemptFromTesting"
                                        name="exemptFromTesting"
                                        type="checkbox"
                                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                                        checked={formData.exemptFromTesting}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="exemptFromTesting" className="ml-2 block text-sm text-gray-900">
                                        Exempt from Testing
                                        <span className="ml-1 text-xs text-gray-500">
                                            (Will not receive notifications)
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserEdit;