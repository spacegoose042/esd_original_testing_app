import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [showInactive, setShowInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users', {
                params: { showInactive }
            });
            
            // Check if response.data is an array
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
    }, [showInactive]);

    const handleToggleActive = async (userId) => {
        try {
            await api.patch(`/users/${userId}/toggle-active`);
            await fetchUsers();
        } catch (err) {
            console.error('Error updating user status:', err);
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.error || 'Failed to update user status');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!Array.isArray(users) || users.length === 0) {
        return <div>No users found.</div>;
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