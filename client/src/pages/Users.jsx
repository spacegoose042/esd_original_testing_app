import { useState, useEffect } from 'react';
import api from '../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [showInactive, setShowInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users', {
                params: { showInactive }
            });
            setUsers(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [showInactive]);

    const handleToggleActive = async (userId) => {
        try {
            await api.patch(`/users/${userId}/toggle-active`);
            await fetchUsers();
        } catch (err) {
            console.error('Error updating user status:', err);
            setError('Failed to update user status');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    Show Inactive Users
                </label>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.email}</td>
                            <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                            <td>{user.is_admin ? 'Admin' : 'User'}</td>
                            <td>
                                <button onClick={() => handleToggleActive(user.id)}>
                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Users;