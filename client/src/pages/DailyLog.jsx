import { useState, useEffect } from 'react';
import api from '../services/api';

function DailyLog() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameFilter, setNameFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/tests/daily-status');
                setUsers(response.data);
                setError('');
            } catch (err) {
                console.error('Error fetching daily status:', err);
                setError(err.response?.data?.error || 'Failed to load daily status');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Filter users based on name search
    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName.includes(nameFilter.toLowerCase());
    });

    if (loading) return <div className="text-center py-4">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Daily Test Log</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    {nameFilter && (
                        <button
                            onClick={() => setNameFilter('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                1st Test (AM)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                2nd Test (PM)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.first_name} {user.last_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.am_test ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.am_test.passed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.am_test.passed ? 'PASS' : 'FAIL'}
                                            <span className="ml-2 text-gray-500">
                                                ({user.am_test.time})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Not Tested</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.pm_test ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.pm_test.passed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.pm_test.passed ? 'PASS' : 'FAIL'}
                                            <span className="ml-2 text-gray-500">
                                                ({user.pm_test.time})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Not Tested</span>
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

export default DailyLog; 