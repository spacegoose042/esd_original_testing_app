import TestForm from '../components/TestForm';

function Home({ isAuthenticated }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">ESD Testing System</h1>
            {isAuthenticated ? (
                <TestForm />
            ) : (
                <div className="text-center">
                    <p className="text-lg mb-4">Welcome to the ESD Testing System</p>
                    <p className="text-gray-600">Please log in to submit test results.</p>
                </div>
            )}
        </div>
    );
}

export default Home;