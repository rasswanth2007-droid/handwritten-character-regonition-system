import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { Users, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await authAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-gray-400 mt-2">Manage users and system settings</p>
      </div>

      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>

        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Active</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4 font-semibold">{user.username}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        user.role === 'admin' ? 'bg-red-600' :
                        user.role === 'researcher' ? 'bg-blue-600' : 'bg-green-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={user.is_active ? 'text-green-500' : 'text-red-500'}>
                        {user.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-danger text-sm"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No users found</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Total Users</h3>
          </div>
          <p className="text-4xl font-bold">{users.length}</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold">Active Users</h3>
          </div>
          <p className="text-4xl font-bold">{users.filter(u => u.is_active).length}</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Admins</h3>
          </div>
          <p className="text-4xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
