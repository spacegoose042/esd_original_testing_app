function Admin() {
    // Mock data - will be replaced with real data from backend
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', lastTest: '2024-03-20' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', lastTest: '2024-03-19' },
    ];
  
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Export Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Export Data</h2>
          <div className="flex gap-4">
            <button className="bg-secondary hover:bg-orange-700 text-white px-4 py-2 rounded">
              Export to CSV
            </button>
            <select className="border rounded px-4 py-2">
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="week">Last Week</option>
            </select>
          </div>
        </div>
  
        {/* User Management Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <button className="bg-primary hover:bg-green-700 text-white px-4 py-2 rounded">
              Add New User
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.lastTest}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary hover:text-green-700 mr-4">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* System Settings Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Morning Test Deadline</label>
              <input type="time" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" defaultValue="10:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Evening Test Deadline</label>
              <input type="time" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" defaultValue="14:00" />
            </div>
            <button className="bg-primary hover:bg-green-700 text-white px-4 py-2 rounded">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default Admin;