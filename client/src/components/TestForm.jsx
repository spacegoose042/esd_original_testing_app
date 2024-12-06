import { useState } from 'react';
import api from '../services/api';

function TestForm() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        test_period: 'AM Test',
        passed: false,
        notes: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Submitting test:', formData);
            const response = await api.post('/tests/submit', formData);
            console.log('Submit response:', response.data);
            
            setMessage(response.data.message || 'Test submitted successfully');
            setFormData({
                first_name: '',
                last_name: '',
                test_period: 'AM Test',
                passed: false,
                notes: ''
            });
        } catch (err) {
            console.error('Submit error:', err);
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
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Submit Test Result</h2>
            
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {message}
                </div>
            )}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        First Name
                    </label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Last Name
                    </label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Test Period
                    </label>
                    <select
                        name="test_period"
                        value={formData.test_period}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="AM Test">Morning Test</option>
                        <option value="PM Test">Afternoon Test</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="passed"
                        name="passed"
                        checked={formData.passed}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="passed" className="ml-2 block text-gray-700">
                        Test Passed
                    </label>
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                        rows="3"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                    Submit Test
                </button>
            </form>
        </div>
    );
}

export default TestForm;
