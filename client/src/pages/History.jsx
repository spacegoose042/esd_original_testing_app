import { useState, useEffect } from 'react';

function History() {
    const [tests, setTests] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        name: '',
        period: '',
        result: ''
    });

    useEffect(() => {
        // Check if user is admin
        const token = localStorage.getItem('token');
        if (token) {
            fetch('http://localhost:5001/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => setIsAdmin(data.isAdmin))
            .catch(err => console.error('Error verifying admin status:', err));
        }

        // Set default date range (last 7 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchTests();
        }
    }, [startDate, endDate]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5001/api/tests/history?start_date=${startDate}&end_date=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to fetch tests');
            const data = await response.json();
            setTests(data);
            setError('');
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load test history');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (filteredOnly) => {
        try {
            const token = localStorage.getItem('token');
            
            if (filteredOnly) {
                // Export filtered/current view data
                const dataToExport = filteredTests.map(test => ({
                    test_date: formatDate(test.test_date),
                    test_time: formatTime(test.test_time),
                    test_period: test.test_period,
                    result: test.passed ? 'PASS' : 'FAIL',
                    first_name: test.first_name,
                    last_name: test.last_name,
                    manager_email: test.manager_email
                }));

                const fields = ['test_date', 'test_time', 'test_period', 'result', 'first_name', 'last_name', 'manager_email'];
                const csv = convertToCSV(dataToExport, fields);
                downloadCSV(csv, `esd_tests_filtered_${startDate}_to_${endDate}.csv`);
                return;
            }

            // Export all data
            const response = await fetch(
                `http://localhost:5001/api/tests/export?start_date=${startDate}&end_date=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `esd_tests_${startDate}_to_${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export error:', err);
            setError(err.message || 'Failed to export data');
            setTimeout(() => setError(''), 3000);
        }
    };

    const convertToCSV = (data, fields) => {
        if (data.length === 0) return '';

        // Create header
        let csv = fields.join(',') + '\n';

        // Add data rows
        data.forEach(item => {
            const row = fields.map(field => {
                const value = item[field] || '';
                // Handle values that might contain commas
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csv += row.join(',') + '\n';
        });

        return csv;
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatTime = (timeString) => {
        // Handle PostgreSQL time format
        return timeString.slice(0, 5); // Gets HH:MM from the time string
    };

    const filteredTests = tests.filter(test => {
        const nameMatch = `${test.first_name} ${test.last_name}`
            .toLowerCase()
            .includes(filters.name.toLowerCase());
        const periodMatch = !filters.period || test.test_period === filters.period;
        const resultMatch = !filters.result || 
            (filters.result === 'PASS' ? test.passed : !test.passed);
        return nameMatch && periodMatch && resultMatch;
    });

    return (
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Test History</h1>
                {isAdmin && (
                    <div className="space-x-4">
                        <button
                            onClick={() => handleExport(true)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Export Current View
                        </button>
                        <button
                            onClick={() => handleExport(false)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Export All Results
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6 flex flex-wrap gap-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="shadow border rounded py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="shadow border rounded py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name Filter</label>
                    <input
                        type="text"
                        value={filters.name}
                        onChange={(e) => setFilters({...filters, name: e.target.value})}
                        placeholder="Search by name..."
                        className="shadow border rounded py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Period</label>
                    <select
                        value={filters.period}
                        onChange={(e) => setFilters({...filters, period: e.target.value})}
                        className="shadow border rounded py-2 px-3"
                    >
                        <option value="">All</option>
                        <option value="AM Test">Morning</option>
                        <option value="PM Test">Afternoon</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Result</label>
                    <select
                        value={filters.result}
                        onChange={(e) => setFilters({...filters, result: e.target.value})}
                        className="shadow border rounded py-2 px-3"
                    >
                        <option value="">All</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="bg-white shadow-md rounded my-6">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Date</th>
                                <th className="py-3 px-6 text-left">Time</th>
                                <th className="py-3 px-6 text-left">Name</th>
                                <th className="py-3 px-6 text-left">Period</th>
                                <th className="py-3 px-6 text-left">Result</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm">
                            {filteredTests.map(test => (
                                <tr 
                                    key={test.id} 
                                    className={`border-b border-gray-200 hover:bg-opacity-90 
                                        ${test.passed ? 'bg-green-100' : 'bg-red-100'}`}
                                >
                                    <td className="py-3 px-6">{formatDate(test.test_date)}</td>
                                    <td className="py-3 px-6">{formatTime(test.test_time)}</td>
                                    <td className="py-3 px-6">{`${test.first_name} ${test.last_name}`}</td>
                                    <td className="py-3 px-6">{test.test_period}</td>
                                    <td className="py-3 px-6 font-bold">
                                        {test.passed ? 'PASS' : 'FAIL'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default History;