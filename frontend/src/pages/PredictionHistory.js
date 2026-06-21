import React, { useEffect, useState } from 'react';
import { recognitionAPI } from '../services/api';
import { History, Eye, Download } from 'lucide-react';

const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await recognitionAPI.getPredictions();
      setPredictions(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await recognitionAPI.getPrediction(id);
      setSelectedPrediction(response.data);
    } catch (error) {
      console.error('Error fetching prediction details:', error);
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
        <h1 className="text-3xl font-bold">Prediction History</h1>
        <p className="text-gray-400 mt-2">View all your past predictions</p>
      </div>

      {predictions.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Image</th>
                  <th className="text-left py-3 px-4">Character</th>
                  <th className="text-left py-3 px-4">Confidence</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <img
                        src={prediction.image}
                        alt="Prediction"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
                        {prediction.predicted_character}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-500 font-semibold">
                        {(prediction.confidence_score * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                        {prediction.input_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(prediction.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewDetails(prediction.id)}
                        className="btn-primary text-sm"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No predictions yet. Start by drawing or uploading an image!</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Prediction Details</h2>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedPrediction.image}
                  alt="Prediction"
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Predicted Character</p>
                  <p className="text-4xl font-bold">{selectedPrediction.predicted_character}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Confidence Score</p>
                  <p className="text-2xl font-semibold text-green-500">
                    {(selectedPrediction.confidence_score * 100).toFixed(2)}%
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Input Method</p>
                  <p className="text-lg">{selectedPrediction.input_method}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-lg">{new Date(selectedPrediction.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Top Predictions</p>
                  <div className="space-y-2">
                    {Object.entries(selectedPrediction.top_predictions)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([char, confidence]) => (
                        <div key={char} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <span className="font-semibold">{char}</span>
                          <span className="text-green-500">{(confidence * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory;
