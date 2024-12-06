import { useState, useEffect } from 'react';
import api from '../services/api';

function History() {
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Initialize date range to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        dateRange: {
            start: todayStr,
            end: todayStr
        },
        user: '',
        period: '',
        result: ''
    });

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await api.get('/tests/history', {
                    headers: { Authorization: undefined } // Remove auth requirement
                });
                const testData = Array.isArray(response.data) ? response.data : [];
                console.log('Fetched test data:', testData.slice(0, 3)); // Log first 3 tests
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
            try {
                const testDate = test.test_date;
                if (!testDate) return false;

                console.log('Comparing dates:', {
                    testDate,
                    start: filters.dateRange.start,
                    end: filters.dateRange.end
                });
                
                return testDate >= filters.dateRange.start && testDate <= filters.dateRange.end;
            } catch (err) {
                console.error('Error filtering date:', err);
                return false;
            }
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
            filtered = filtered.filter(test => {
                console.log('Testing period filter:', { 
                    testPeriod: test.test_period, 
                    filterPeriod: filters.period,
                    test 
                });
                return test.test_period && test.test_period.startsWith(filters.period);
            });
        }

        // Result filter
        if (filters.result) {
            filtered = filtered.filter(test => {
                const testResult = test.passed ? 'pass' : 'fail';
                return testResult === filters.result.toLowerCase();
            });
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
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filters.dateRange.start}
                            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                            className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="date"
                            value={filters.dateRange.end}
                            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                            className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <input
                        type="text"
                        value={filters.user}
                        onChange={(e) => handleFilterChange('user', e.target.value)}
                        placeholder="Search by name"
                        className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <select
                        value={filters.period}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All</option>
                        <option value="AM">Morning</option>
                        <option value="PM">Evening</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                    <select
                        value={filters.result}
                        onChange={(e) => handleFilterChange('result', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                    </select>
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
                                    {test.test_date}
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
                                    {test.notes || ''}
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