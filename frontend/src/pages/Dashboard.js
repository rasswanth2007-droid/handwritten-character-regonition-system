import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import { Brain, TrendingUp, CheckCircle, Activity } from 'lucide-react';
import Plot from 'react-plotly.js';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await analyticsAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-2">Overview of your character recognition activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Predictions</p>
              <p className="text-3xl font-bold mt-2">{stats?.total_predictions || 0}</p>
            </div>
            <Brain className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-3xl font-bold mt-2">{stats?.accuracy || 0}%</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Confidence</p>
              <p className="text-3xl font-bold mt-2">{(stats?.avg_confidence * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Correct Predictions</p>
              <p className="text-3xl font-bold mt-2">{stats?.correct_predictions || 0}</p>
            </div>
            <Activity className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate('/canvas')}
          className="card hover:bg-gray-700 transition cursor-pointer"
        >
          <div className="text-center">
            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Draw Character</h3>
            <p className="text-gray-400">Draw a character on canvas for recognition</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/upload')}
          className="card hover:bg-gray-700 transition cursor-pointer"
        >
          <div className="text-center">
            <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
            <p className="text-gray-400">Upload an image for character recognition</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="card hover:bg-gray-700 transition cursor-pointer"
        >
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">View Analytics</h3>
            <p className="text-gray-400">Explore detailed analytics and insights</p>
          </div>
        </button>
      </div>

      {/* Recent Predictions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
        {stats?.recent_predictions && stats.recent_predictions.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_predictions.map((pred) => (
              <div key={pred.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                    {pred.character}
                  </div>
                  <div>
                    <p className="font-semibold">Character: {pred.character}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(pred.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-semibold">
                    {(pred.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">Confidence</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No predictions yet. Start by drawing or uploading an image!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
