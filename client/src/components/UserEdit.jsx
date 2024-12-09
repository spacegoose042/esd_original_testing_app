import { useState, useEffect } from 'react';
import api from '../services/api';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerId: '',
        departmentId: '',
        isAdmin: false,
        isActive: false,
        isManager: false,
        exemptFromTesting: false
    });
    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all required data in parallel
                const [userResponse, managersResponse, departmentsResponse] = await Promise.all([
                    api.get(`/users/${userId}`),
                    api.get('/users/managers'),
                    api.get('/users/departments')
                ]);

                console.log('Fetched data:', {
                    user: userResponse.data,
                    managers: managersResponse.data,
                    departments: departmentsResponse.data
                });

                setManagers(managersResponse.data);
                setDepartments(departmentsResponse.data);

                setFormData({
                    firstName: userResponse.data.first_name,
                    lastName: userResponse.data.last_name,
                    managerId: userResponse.data.manager_id || '',
                    departmentId: userResponse.data.department_id || '',
                    isAdmin: userResponse.data.is_admin === true,
                    isActive: userResponse.data.is_active === true,
                    isManager: userResponse.data.is_manager === true,
                    exemptFromTesting: userResponse.data.exempt_from_testing === true
                });
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.response?.status === 401) {
                    // Handle unauthorized access
                    setError('Please log in again');
                    return;
                }
                setError(err.response?.data?.error || 'Failed to load data');
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                managerId: formData.managerId,
                departmentId: formData.departmentId,
                isAdmin: formData.isAdmin,
                isActive: formData.isActive,
                isManager: formData.isManager,
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
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleResetPassword = async () => {
        try {
            const response = await api.post(`/users/${userId}/reset-password`);
            console.log('Password reset response:', response.data);
            setResetPasswordSuccess(`New password: ${response.data.newPassword}`);
            setTimeout(() => setResetPasswordSuccess(''), 30000); // Clear after 30 seconds
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.response?.data?.error || 'Failed to reset password');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">Edit User</h2>
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
                        {resetPasswordSuccess && (
                            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative">
                                {resetPasswordSuccess}
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
                                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">Department</label>
                                <select
                                    id="departmentId"
                                    name="departmentId"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.departmentId}
                                    onChange={handleChange}
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
                                <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">Manager</label>
                                <select
                                    id="managerId"
                                    name="managerId"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.managerId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Manager</option>
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
                                        id="isManager"
                                        name="isManager"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={formData.isManager}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="isManager" className="ml-2 block text-sm text-gray-900">
                                        Is Manager
                                        <span className="ml-1 text-xs text-gray-500">
                                            (Can receive notifications about team members)
                                        </span>
                                    </label>
                                </div>

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
                                            (Will not receive notifications about their own tests, but will still receive notifications about team members)
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col space-y-3">
                            {(formData.isAdmin || formData.isManager) && (
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    className="w-full px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                    Reset Password
                                </button>
                            )}
                            <div className="flex justify-end space-x-3">
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserEdit;