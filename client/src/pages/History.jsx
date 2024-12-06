import { useState, useEffect } from 'react';
import api from '../services/api';

function History() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await api.get('/tests/history', {
                    headers: { Authorization: undefined } // Remove auth header
                });
                setTests(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching test history:', err);
                setError('Failed to load test history');
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    if (loading) {
        return <div>Loading test history...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Test History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Period</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tests.map((test) => (
                            <tr key={test.id}>
                                <td className="border px-4 py-2">{test.test_date}</td>
                                <td className="border px-4 py-2">{test.test_time}</td>
                                <td className="border px-4 py-2">
                                    {test.first_name} {test.last_name}
                                </td>
                                <td className="border px-4 py-2">{test.test_period}</td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded ${
                                        test.passed 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {test.passed ? 'Passed' : 'Failed'}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">{test.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default History;