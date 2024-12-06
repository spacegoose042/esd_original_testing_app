import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Users.css';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerId: '',
        isAdmin: false
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
                    isAdmin: userResponse.data.is_admin
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
            // Only include isAdmin in the update if the current user is an admin
            const updateData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                manager_id: formData.managerId,
                ...(currentUser?.isAdmin ? { is_admin: formData.isAdmin } : {})
            };

            await api.put(`/users/${userId}`, updateData);

            setSuccess('User updated successfully');
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
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

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            
            if (Array.isArray(response.data)) {
                setUsers(response.data);
                setError(null);
            } else {
                console.error('Invalid response format:', response.data);
                setUsers([]);
                setError('Invalid data format received');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.error || 'Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (userId) => {
        setEditingUserId(userId);
    };

    const handleCloseEdit = () => {
        setEditingUserId(null);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!Array.isArray(users) || users.length === 0) {
        return <div className="no-data">No users found.</div>;
    }

    return (
        <div className="users-container">
            <h2>User Management</h2>
            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Manager</th>
                            <th>Admin</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="name-cell">
                                    {user.first_name} {user.last_name}
                                </td>
                                <td>{user.department_name || 'N/A'}</td>
                                <td>{user.role}</td>
                                <td>{user.manager_name}</td>
                                <td>
                                    <span className={`admin-badge ${user.is_admin ? 'is-admin' : ''}`}>
                                        {user.is_admin ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="edit-button"
                                        onClick={() => handleEdit(user.id)}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUserId && (
                <UserEdit
                    userId={editingUserId}
                    onClose={handleCloseEdit}
                    onUpdate={fetchUsers}
                />
            )}
        </div>
    );
}

export default Users;