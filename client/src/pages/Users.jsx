import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Users.css';

function UserEdit({ userId, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        managerId: '',
        departmentId: '',
        isAdmin: false,
        isActive: true,
        isManager: false,
        exemptFromTesting: false
    });
    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current user's auth status, user data, managers list, and departments
                const [authResponse, userResponse, managersResponse, departmentsResponse] = await Promise.all([
                    api.get('/auth/verify'),
                    api.get(`/users/${userId}`),
                    api.get('/users/managers'),
                    api.get('/users/departments')
                ]);

                setCurrentUser(authResponse.data);
                setManagers(managersResponse.data);
                setDepartments(departmentsResponse.data);

                // Set user data
                setFormData({
                    firstName: userResponse.data.first_name,
                    lastName: userResponse.data.last_name,
                    managerId: userResponse.data.manager_id || '',
                    departmentId: userResponse.data.department_id || '',
                    isAdmin: userResponse.data.is_admin || false,
                    isActive: userResponse.data.is_active !== false,
                    isManager: userResponse.data.is_manager || false,
                    exemptFromTesting: userResponse.data.exempt_from_testing || false
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
            
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                managerId: formData.managerId,
                departmentId: formData.departmentId,
                isAdmin: Boolean(formData.isAdmin),
                isActive: Boolean(formData.isActive),
                isManager: Boolean(formData.isManager),
                exemptFromTesting: Boolean(formData.exemptFromTesting)
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
                        <label>Department</label>
                        <select
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            required
                            className="department-select"
                        >
                            <option value="">Select a Department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
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
                        <div className="checkbox-group">
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isManager"
                                        checked={formData.isManager}
                                        onChange={handleChange}
                                    />
                                    Is Manager
                                    <span className="help-text">
                                        (Can receive notifications about team members)
                                    </span>
                                </label>
                            </div>

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

                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="exemptFromTesting"
                                        checked={formData.exemptFromTesting}
                                        onChange={handleChange}
                                    />
                                    Exempt from Testing
                                    <span className="help-text">
                                        (Will not receive notifications about their own tests, but will still receive notifications about team members)
                                    </span>
                                </label>
                            </div>
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
    const [filters, setFilters] = useState({
        first_name: '',
        last_name: '',
        department_name: '',
        role: '',
        manager_name: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const handleEdit = (userId) => {
        setEditingUserId(userId);
    };

    const handleCloseEdit = () => {
        setEditingUserId(null);
    };

    const handleResetPassword = (userId) => {
        setResettingUserId(userId);
    };

    const handleCloseReset = () => {
        setResettingUserId(null);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Combined filtering logic for both active status and other filters
    const filteredUsers = users.filter(user => {
        // First filter by active status
        if (!showInactive && !user.is_active) return false;
        if (showInactive && user.is_active) return false;

        // Then apply the text filters
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return user[key]?.toLowerCase().includes(value.toLowerCase());
        });
    });

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
            
            {/* Filters */}
            <div className="filters-container">
                <div className="text-filters">
                    <input
                        type="text"
                        placeholder="Filter by First Name"
                        value={filters.first_name}
                        onChange={(e) => handleFilterChange('first_name', e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Last Name"
                        value={filters.last_name}
                        onChange={(e) => handleFilterChange('last_name', e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Department"
                        value={filters.department_name}
                        onChange={(e) => handleFilterChange('department_name', e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Role"
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="filter-input"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Manager"
                        value={filters.manager_name}
                        onChange={(e) => handleFilterChange('manager_name', e.target.value)}
                        className="filter-input"
                    />
                </div>
                <div className="active-filter">
                    <label className="active-filter-label">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="active-checkbox"
                        />
                        Show Inactive Users
                    </label>
                </div>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Manager</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className={!user.is_active ? 'inactive-user' : ''}>
                                <td className="name-cell">
                                    {user.first_name} {user.last_name}
                                </td>
                                <td>{user.department_name || 'N/A'}</td>
                                <td>{user.role}</td>
                                <td>{user.manager_name}</td>
                                <td>
                                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEdit(user.id)}
                                    >
                                        Edit
                                    </button>
                                    {user.email && (
                                        <button
                                            className="reset-button ml-2"
                                            onClick={() => handleResetPassword(user.id)}
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
                    onClose={handleCloseEdit}
                    onUpdate={fetchUsers}
                />
            )}

            {resettingUserId && (
                <ResetPasswordModal
                    userId={resettingUserId}
                    userName={users.find(u => u.id === resettingUserId)?.first_name + ' ' + users.find(u => u.id === resettingUserId)?.last_name}
                    onClose={handleCloseReset}
                    onReset={fetchUsers}
                />
            )}
        </div>
    );
}

export default Users;