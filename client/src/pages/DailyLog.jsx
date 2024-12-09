import { useState, useEffect } from 'react';
import api from '../services/api';

function DailyLog() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDailyStatus = async () => {
            try {
                // Get all active users with their test status for today
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

        fetchDailyStatus();
        // Refresh every 5 minutes
        const interval = setInterval(fetchDailyStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Daily Test Log</h1>
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
                        {users.map((user) => (
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