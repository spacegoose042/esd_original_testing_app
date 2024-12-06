import { useState, useEffect } from 'react';
import api from '../services/api';
import './Users.css';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        first_name: '',
        last_name: '',
        department_name: '',
        role: '',
        manager_name: '',
        is_active: 'all'
    });
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load users');
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/users/${userId}`, {
                is_active: !currentStatus
            });
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    const filteredUsers = users.filter(user => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value || value === 'all') return true;
            if (key === 'is_active') {
                return value === 'all' ? true : user.is_active === (value === 'active');
            }
            return user[key]?.toLowerCase().includes(value.toLowerCase());
        });
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="users-container">
            <h2>Users Management</h2>
            
            {/* Filters */}
            <div className="filters-container">
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
                <select
                    value={filters.is_active}
                    onChange={(e) => handleFilterChange('is_active', e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Users</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Manager</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={!user.is_active ? 'inactive-user' : ''}>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
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
                                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                                        className={`status-toggle-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                                    >
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Users;