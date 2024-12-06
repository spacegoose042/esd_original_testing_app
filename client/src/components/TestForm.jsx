import { useState, useEffect } from 'react';
import api from '../services/api';

function TestForm() {
    const [formData, setFormData] = useState({
        fullName: '',
        test_period: '',
        passed: null,
        notes: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showNotes, setShowNotes] = useState(false);

    useEffect(() => {
        const fetchActiveUsers = async () => {
            try {
                const response = await api.get('/tests/active-users');
                setActiveUsers(response.data);
            } catch (err) {
                console.error('Failed to fetch active users:', err);
            }
        };
        fetchActiveUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.test_period) {
            setError('Please select a test period');
            return;
        }

        if (formData.passed === null) {
            setError('Please select pass or fail');
            return;
        }

        try {
            const names = formData.fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ');

            const submitData = {
                first_name: firstName,
                last_name: lastName,
                test_period: formData.test_period,
                passed: formData.passed,
                notes: formData.notes
            };

            console.log('Submitting test:', submitData);
            const response = await api.post('/tests/submit', submitData);
            console.log('Submit response:', response.data);
            
            setMessage(response.data.message || 'Test submitted successfully');
            setFormData({
                fullName: '',
                test_period: '',
                passed: null,
                notes: ''
            });
            setShowNotes(false);
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.error || 'Failed to submit test');
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, fullName: value }));
        
        if (value.length > 0) {
            const filtered = activeUsers.filter(user => 
                user.full_name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setFormData(prev => ({ ...prev, fullName: suggestion.full_name }));
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleNotes = () => {
        setShowNotes(!showNotes);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center">Submit Test Result</h2>
            
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-lg">
                    {message}
                </div>
            )}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <label className="block text-gray-700 text-lg font-bold mb-3">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleNameChange}
                        required
                        className="w-full px-4 py-3 text-lg border rounded-lg"
                        placeholder="Enter full name"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-auto">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-3 text-lg hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion.full_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 text-lg font-bold mb-3">
                        Test Period
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, test_period: 'AM Test' }))}
                            className={`py-8 px-4 text-xl font-semibold rounded-lg transition-colors duration-200 ${
                                formData.test_period === 'AM Test'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            } active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                        >
                            1st Test
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, test_period: 'PM Test' }))}
                            className={`py-8 px-4 text-xl font-semibold rounded-lg transition-colors duration-200 ${
                                formData.test_period === 'PM Test'
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                            } active:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                        >
                            2nd Test
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 text-lg font-bold mb-3">
                        Test Result
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, passed: true }))}
                            className={`py-8 px-4 text-xl font-semibold rounded-lg transition-colors duration-200 ${
                                formData.passed === true
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            } active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
                        >
                            PASS
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, passed: false }))}
                            className={`py-8 px-4 text-xl font-semibold rounded-lg transition-colors duration-200 ${
                                formData.passed === false
                                ? 'bg-red-600 text-white'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            } active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`}
                        >
                            FAIL
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-8 px-4 text-xl font-semibold rounded-lg hover:bg-blue-600 transition-colors duration-200 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Submit Test
                </button>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={toggleNotes}
                        className={`w-full py-3 px-4 text-base font-medium rounded-lg transition-colors duration-200 ${
                            showNotes
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50`}
                    >
                        {showNotes ? 'Hide Notes' : 'Add Notes'}
                    </button>
                    
                    {showNotes && (
                        <div className="mt-3">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-4 py-3 text-lg border rounded-lg"
                                rows="3"
                                placeholder="Enter notes here..."
                            />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

export default TestForm;
