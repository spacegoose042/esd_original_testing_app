import { useState } from 'react';
import api from '../services/api';

function Home() {
    const [formData, setFormData] = useState({
        name: '',
        test_period: 'AM Test',
        passed: false,
        notes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.post('/tests/submit', formData);
            setSuccess('Test submitted successfully');
            setFormData({
                name: '',
                test_period: 'AM Test',
                passed: false,
                notes: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit test');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">ESD Test Submission</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="test_period">
                        Test Period
                    </label>
                    <select
                        id="test_period"
                        name="test_period"
                        value={formData.test_period}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="AM Test">Morning Test</option>
                        <option value="PM Test">Afternoon Test</option>
                    </select>
                </div>

                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="passed"
                        name="passed"
                        checked={formData.passed}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="passed" className="ml-2 block text-sm text-gray-900">
                        Test Passed
                    </label>
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Submit Test
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Home;