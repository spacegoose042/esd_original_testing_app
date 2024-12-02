import { useState, useEffect } from 'react';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerEmail: '',
        isAdmin: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token exists:', !!token);
                console.log('Fetching user with ID:', userId);

                const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server response:', errorData);
                    throw new Error(errorData.error || 'Failed to fetch user');
                }

                const data = await response.json();
                console.log('User data received:', data);

                setFormData({
                    firstName: data.first_name,
                    lastName: data.last_name,
                    managerEmail: data.manager_email || '',
                    isAdmin: data.is_admin
                });
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user data');
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    manager_email: formData.managerEmail,
                    is_admin: formData.isAdmin
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }

            setSuccess('User updated successfully');
            setTimeout(() => {
                onUpdate(); // Refresh the users list
                onClose(); // Close the edit form
            }, 2000);

        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.message || 'Failed to update user');
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

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
                                <label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700">Manager's Email</label>
                                <input
                                    id="managerEmail"
                                    name="managerEmail"
                                    type="email"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.managerEmail}
                                    onChange={handleChange}
                                />
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