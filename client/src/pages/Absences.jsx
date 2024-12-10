import { useState, useEffect } from 'react';
import api from '../services/api';

function Absences() {
    const [users, setUsers] = useState([]);
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [newAbsence, setNewAbsence] = useState({
        date: new Date().toISOString().split('T')[0],
        period: 'FULL',
        reason: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersResponse = await api.get('/users');
                setUsers(usersResponse.data.filter(user => !user.exempt_from_testing));
                
                if (selectedUser) {
                    const absencesResponse = await api.get(`/users/${selectedUser}/absences`);
                    setAbsences(absencesResponse.data);
                }
            } catch (err) {
                setError('Failed to load data');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/users/${selectedUser}/absences`, newAbsence);
            // Refresh absences
            const response = await api.get(`/users/${selectedUser}/absences`);
            setAbsences(response.data);
            // Reset form
            setNewAbsence({
                date: new Date().toISOString().split('T')[0],
                period: 'FULL',
                reason: ''
            });
        } catch (err) {
            setError('Failed to record absence');
            console.error('Error recording absence:', err);
        }
    };

    const handleDelete = async (absenceId) => {
        if (!window.confirm('Are you sure you want to delete this absence record?')) {
            return;
        }

        try {
            await api.delete(`/users/${selectedUser}/absences/${absenceId}`);
            setAbsences(absences.filter(absence => absence.id !== absenceId));
        } catch (err) {
            setError('Failed to delete absence');
            console.error('Error deleting absence:', err);
        }
    };

    if (loading) return <div className="text-center py-4">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Manage Absences</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Add New Absence */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Record New Absence</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Employee
                            </label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                required
                            >
                                <option value="">Select Employee</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.first_name} {user.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={newAbsence.date}
                                onChange={(e) => setNewAbsence({...newAbsence, date: e.target.value})}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Period
                            </label>
                            <select
                                className="w-full p-2 border rounded"
                                value={newAbsence.period}
                                onChange={(e) => setNewAbsence({...newAbsence, period: e.target.value})}
                                required
                            >
                                <option value="FULL">Full Day</option>
                                <option value="AM">Morning</option>
                                <option value="PM">Afternoon</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Reason
                            </label>
                            <textarea
                                className="w-full p-2 border rounded"
                                value={newAbsence.reason}
                                onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                                rows="3"
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            disabled={!selectedUser}
                        >
                            Record Absence
                        </button>
                    </form>
                </div>

                {/* Right Column - Absence History */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Absence History</h2>
                    {selectedUser ? (
                        absences.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Period
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reason
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {absences.map(absence => (
                                            <tr key={absence.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(absence.absence_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {absence.period}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {absence.reason || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleDelete(absence.id)}
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
                        ) : (
                            <p className="text-gray-500">No absences recorded</p>
                        )
                    ) : (
                        <p className="text-gray-500">Select an employee to view absence history</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Absences; 