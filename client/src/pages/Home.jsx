import TestForm from '../components/TestForm';

function Home() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">ESD Testing System</h1>
            <TestForm />
        </div>
    );
}

export default Home;