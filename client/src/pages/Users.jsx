import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Users.css';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerId: '',
        isAdmin: false,
        isActive: true
    });
    const [managers, setManagers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current user's auth status, user data, and managers list
                const [authResponse, userResponse, managersResponse] = await Promise.all([
                    api.get('/auth/verify'),
                    api.get(`/users/${userId}`),
                    api.get('/users/managers')
                ]);

                setCurrentUser(authResponse.data);
                setManagers(managersResponse.data);

                // Set user data
                setFormData({
                    firstName: userResponse.data.first_name,
                    lastName: userResponse.data.last_name,
                    managerId: userResponse.data.manager_id || '',
                    isAdmin: userResponse.data.is_admin || false,
                    isActive: userResponse.data.is_active !== false // default to true if undefined
                });
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.error || 'Failed to load data');
            }
        };
        fetchData();
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Submitting update with data:', formData);
            
            // Send all required fields
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                managerId: formData.managerId,
                isAdmin: Boolean(formData.isAdmin)
            };

            console.log('Transformed update data:', updateData);

            const response = await api.put(`/users/${userId}`, updateData);
            console.log('Update response:', response.data);

            setSuccess('User updated successfully');
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Update error:', err);
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               err.response?.data?.detail ||
                               'Failed to update user';
            setError(errorMessage);
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit User</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Manager</label>
                        <select
                            name="managerId"
                            value={formData.managerId}
                            onChange={handleChange}
                            required
                            className="manager-select"
                        >
                            <option value="">Select a Manager</option>
                            {managers.map(manager => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.first_name} {manager.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentUser?.isAdmin && (
                        <>
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isAdmin"
                                        checked={formData.isAdmin}
                                        onChange={handleChange}
                                    />
                                    Is Admin
                                </label>
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    Is Active
                                </label>
                            </div>
                        </>
                    )}

                    <div className="button-group">
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                        <button type="submit" className="save-button">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResetPasswordModal({ userId, userName, onClose, onReset }) {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await api.post(`/users/${userId}/reset-password`);
            setNewPassword(response.data.newPassword);
            setSuccess('Password reset successful');
            
            setTimeout(() => {
                onReset();
                onClose();
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Reset Password</h2>
                <p>Are you sure you want to reset the password for {userName}?</p>
                
                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div className="success-message">
                        <p>{success}</p>
                        <p>New password: <strong>{newPassword}</strong></p>
                        <p>Please provide this password to the user.</p>
                        <p>This modal will close in 5 seconds.</p>
                    </div>
                )}

                {!success && (
                    <div className="button-group">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="cancel-button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={handleReset}
                            className="reset-button"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [resettingUserId, setResettingUserId] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on active status
    const filteredUsers = users.filter(user => 
        showInactive ? !user.is_active : user.is_active
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Users</h1>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-gray-700">Show Inactive Users</span>
                    </label>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.first_name} {user.last_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.role}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.manager_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setEditingUserId(user.id)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    {user.is_admin && (
                                        <button
                                            onClick={() => setResettingUserId(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Reset Password
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUserId && (
                <UserEdit
                    userId={editingUserId}
                    onClose={() => setEditingUserId(null)}
                    onUpdate={fetchUsers}
                />
            )}

            {resettingUserId && (
                <ResetPasswordModal
                    userId={resettingUserId}
                    userName={users.find(u => u.id === resettingUserId)?.first_name}
                    onClose={() => setResettingUserId(null)}
                    onReset={fetchUsers}
                />
            )}
        </div>
    );
}

export default Users;