import { useState, useEffect } from 'react';
import UserEdit from '../components/UserEdit';

function Users() {
    const [users, setUsers] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkManagerEmail, setBulkManagerEmail] = useState('');
    const [sortField, setSortField] = useState('last_name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            console.log('Fetched users:', data); // Debug log
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete user');
            
            setSuccess('User deleted successfully');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete user');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleBulkManagerUpdate = async () => {
        if (!bulkManagerEmail || selectedUsers.length === 0) {
            setError('Please select users and enter a manager email');
            return;
        }

        try {
            const promises = selectedUsers.map(userId =>
                fetch(`http://localhost:5001/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ manager_email: bulkManagerEmail })
                })
            );

            await Promise.all(promises);
            setSuccess('Manager email updated for selected users');
            fetchUsers();
            setSelectedUsers([]);
            setBulkManagerEmail('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update manager emails');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedAndFilteredUsers = users
        .filter(user => 
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.manager_email || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let compareA = a[sortField] || '';
            let compareB = b[sortField] || '';
            
            if (sortField === 'name') {
                compareA = `${a.first_name} ${a.last_name}`;
                compareB = `${b.first_name} ${b.last_name}`;
            }
            
            return sortDirection === 'asc' 
                ? compareA.localeCompare(compareB)
                : compareB.localeCompare(compareA);
        });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            {(error || success) && (
                <div className={`mb-4 p-3 border rounded ${
                    error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'
                }`}>
                    {error || success}
                </div>
            )}

            <div className="mb-6 space-y-4">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 p-2 border rounded"
                    />
                    <input
                        type="email"
                        placeholder="Manager email for selected users"
                        value={bulkManagerEmail}
                        onChange={(e) => setBulkManagerEmail(e.target.value)}
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        onClick={handleBulkManagerUpdate}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        disabled={selectedUsers.length === 0}
                    >
                        Update Selected
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded my-6">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        setSelectedUsers(e.target.checked ? users.map(u => u.id) : []);
                                    }}
                                    checked={selectedUsers.length === users.length}
                                />
                            </th>
                            <th 
                                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300"
                                onClick={() => handleSort('name')}
                            >
                                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300"
                                onClick={() => handleSort('manager_email')}
                            >
                                Manager Email {sortField === 'manager_email' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="py-3 px-6 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                        {sortedAndFilteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={(e) => {
                                            setSelectedUsers(prev => 
                                                e.target.checked
                                                    ? [...prev, user.id]
                                                    : prev.filter(id => id !== user.id)
                                            );
                                        }}
                                    />
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {user.first_name} {user.last_name}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {user.manager_email || 'Not set'}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    <button
                                        onClick={() => setEditingUserId(user.id)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
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
                    onClose={() => setEditingUserId(null)}
                    onUpdate={fetchUsers}
                />
            )}
        </div>
    );
}

export default Users;