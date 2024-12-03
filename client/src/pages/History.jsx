import { useState, useEffect } from 'react';
import api from '../services/api';

function History() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await api.get('/tests/history');
                setTests(response.data);
            } catch (err) {
                setError('Failed to load test history');
                console.error('Error fetching tests:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Test History</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Time
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Result
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tests.map((test) => (
                            <tr key={test.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(test.test_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.test_time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            test.passed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {test.passed ? 'PASS' : 'FAIL'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default History;