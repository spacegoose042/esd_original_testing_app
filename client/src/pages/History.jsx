import { useState, useEffect } from 'react';
import api from '../services/api';

function History() {
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        },
        user: '',
        period: '',
        result: '',
        notes: ''
    });

    useEffect(() => {
        const fetchTests = async () => {
            try {
                console.log('Fetching test history...');
                const response = await api.get('/tests/history');
                console.log('History response:', response.data);
                const testData = Array.isArray(response.data) ? response.data : [];
                setTests(testData);
                setFilteredTests(testData);
                setError('');
            } catch (err) {
                console.error('Error fetching tests:', err);
                setError(err.response?.data?.error || 'Failed to load test history');
                setTests([]);
                setFilteredTests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    useEffect(() => {
        let filtered = [...tests];

        // Date range filter
        filtered = filtered.filter(test => {
            const testDate = new Date(test.test_date).toISOString().split('T')[0];
            return testDate >= filters.dateRange.start && testDate <= filters.dateRange.end;
        });

        // User filter
        if (filters.user) {
            const searchTerm = filters.user.toLowerCase();
            filtered = filtered.filter(test => 
                `${test.first_name} ${test.last_name}`.toLowerCase().includes(searchTerm)
            );
        }

        // Period filter
        if (filters.period) {
            filtered = filtered.filter(test => 
                test.test_period.toLowerCase().includes(filters.period.toLowerCase())
            );
        }

        // Result filter
        if (filters.result) {
            filtered = filtered.filter(test => {
                const testResult = test.passed ? 'pass' : 'fail';
                return testResult === filters.result.toLowerCase();
            });
        }

        // Notes filter
        if (filters.notes) {
            filtered = filtered.filter(test => 
                test.notes?.toLowerCase().includes(filters.notes.toLowerCase())
            );
        }

        setFilteredTests(filtered);
    }, [tests, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) return <div className="text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (!tests.length) return <div className="text-center">No test history available.</div>;

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4">Test History</h1>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date Range</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filters.dateRange.start}
                            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <input
                            type="date"
                            value={filters.dateRange.end}
                            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <input
                        type="text"
                        value={filters.user}
                        onChange={(e) => handleFilterChange('user', e.target.value)}
                        placeholder="Search by name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <select
                        value={filters.period}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">All</option>
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Result</label>
                    <select
                        value={filters.result}
                        onChange={(e) => handleFilterChange('result', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">All</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input
                        type="text"
                        value={filters.notes}
                        onChange={(e) => handleFilterChange('notes', e.target.value)}
                        placeholder="Search notes"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

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
                                User
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Period
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Result
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Notes
                            </th>
                            <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Manager
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTests.map((test) => (
                            <tr 
                                key={test.id}
                                className={`${
                                    test.passed 
                                        ? 'bg-green-50 hover:bg-green-100' 
                                        : 'bg-red-50 hover:bg-red-100'
                                } transition-colors duration-150`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(test.test_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.test_time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.first_name} {test.last_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.test_period}
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.notes}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {test.manager_name || 'N/A'}
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