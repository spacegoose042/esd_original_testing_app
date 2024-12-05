import { useState, useEffect } from 'react';
import api from '../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [managers, setManagers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        department: '',
        manager: '',
        role: ''
    });
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, managersRes, departmentsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/users/managers'),
                    api.get('/users/departments')
                ]);
                setUsers(usersRes.data);
                setFilteredUsers(usersRes.data);
                setManagers(managersRes.data);
                setDepartments(departmentsRes.data);
                setError('');
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...users];

        if (filters.name) {
            const searchTerm = filters.name.toLowerCase();
            filtered = filtered.filter(user => 
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm)
            );
        }

        if (filters.email) {
            const searchTerm = filters.email.toLowerCase();
            filtered = filtered.filter(user => 
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        if (filters.department) {
            filtered = filtered.filter(user => 
                user.department_id === parseInt(filters.department)
            );
        }

        if (filters.manager) {
            filtered = filtered.filter(user => 
                user.manager_id === parseInt(filters.manager)
            );
        }

        if (filters.role) {
            filtered = filtered.filter(user => {
                if (filters.role === 'admin') return user.is_admin;
                if (filters.role === 'manager') return user.is_manager;
                return !user.is_admin && !user.is_manager;
            });
        }

        setFilteredUsers(filtered);
    }, [users, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEdit = (user) => {
        setEditingUser(user);
    };

    const handleUpdate = async () => {
        try {
            const response = await api.put(`/users/${editingUser.id}`, editingUser);
            setUsers(users.map(user => 
                user.id === editingUser.id ? response.data : user
            ));
            setEditingUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user');
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
    };

    if (loading) return <div className="text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Users Management</h1>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        value={filters.name}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Search by name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="text"
                        value={filters.email}
                        onChange={(e) => handleFilterChange('email', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Search by email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                    <select
                        value={filters.manager}
                        onChange={(e) => handleFilterChange('manager', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">All Managers</option>
                        {managers.map(manager => (
                            <option key={manager.id} value={manager.id}>
                                {manager.first_name} {manager.last_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Department
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Manager
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editingUser.first_name}
                                                onChange={(e) => setEditingUser({
                                                    ...editingUser,
                                                    first_name: e.target.value
                                                })}
                                                className="w-1/2 p-1 border rounded"
                                            />
                                            <input
                                                type="text"
                                                value={editingUser.last_name}
                                                onChange={(e) => setEditingUser({
                                                    ...editingUser,
                                                    last_name: e.target.value
                                                })}
                                                className="w-1/2 p-1 border rounded"
                                            />
                                        </div>
                                    ) : (
                                        `${user.first_name} ${user.last_name}`
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <input
                                            type="email"
                                            value={editingUser.email}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                email: e.target.value
                                            })}
                                            className="w-full p-1 border rounded"
                                        />
                                    ) : (
                                        user.email
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <select
                                            value={editingUser.department_id || ''}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                department_id: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                            className="w-full p-1 border rounded"
                                        >
                                            <option value="">No Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        user.department_name || 'N/A'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <select
                                            value={editingUser.manager_id || ''}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                manager_id: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                            className="w-full p-1 border rounded"
                                        >
                                            <option value="">No Manager</option>
                                            {managers.map(manager => (
                                                <option key={manager.id} value={manager.id}>
                                                    {manager.first_name} {manager.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        user.manager_first_name ? 
                                        `${user.manager_first_name} ${user.manager_last_name}` : 
                                        'N/A'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <select
                                            value={editingUser.is_admin ? 'admin' : editingUser.is_manager ? 'manager' : 'user'}
                                            onChange={(e) => {
                                                const role = e.target.value;
                                                setEditingUser({
                                                    ...editingUser,
                                                    is_admin: role === 'admin',
                                                    is_manager: role === 'manager'
                                                });
                                            }}
                                            className="w-full p-1 border rounded"
                                        >
                                            <option value="user">User</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.is_admin ? 'bg-purple-100 text-purple-800' :
                                            user.is_manager ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : 'User'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingUser?.id === user.id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Edit
                                        </button>
                                    )}
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