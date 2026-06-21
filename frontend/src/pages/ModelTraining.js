import React, { useEffect, useState } from 'react';
import { trainingAPI } from '../services/api';
import { Brain, Play, Rocket, History } from 'lucide-react';
import toast from 'react-hot-toast';

const ModelTraining = () => {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  const [trainingForm, setTrainingForm] = useState({
    model_type: 'combined',
    epochs: 20,
    batch_size: 256,
    learning_rate: 0.001,
    name: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsRes, datasetsRes] = await Promise.all([
        trainingAPI.getModels(),
        trainingAPI.getDatasets(),
      ]);
      setModels(modelsRes.data.results || modelsRes.data);
      setDatasets(datasetsRes.data.results || datasetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async (e) => {
    e.preventDefault();
    setTraining(true);

    try {
      const response = await trainingAPI.trainModel(trainingForm);
      toast.success('Model training started successfully');
      setTrainingProgress(response.data);
      fetchData();
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Failed to start training');
    } finally {
      setTraining(false);
    }
  };

  const handleDeployModel = async (modelId) => {
    try {
      await trainingAPI.deployModel(modelId);
      toast.success('Model deployed successfully');
      fetchData();
    } catch (error) {
      console.error('Error deploying model:', error);
      toast.error('Failed to deploy model');
    }
  };

  const handleViewHistory = async (modelId) => {
    try {
      const response = await trainingAPI.getModelHistory(modelId);
      setSelectedModel({
        id: modelId,
        history: response.data,
      });
    } catch (error) {
      console.error('Error fetching model history:', error);
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
        <h1 className="text-3xl font-bold">Model Training</h1>
        <p className="text-gray-400 mt-2">Train and manage machine learning models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Training Form */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Brain className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Train New Model</h2>
          </div>

          <form onSubmit={handleTrainModel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
              <input
                type="text"
                value={trainingForm.name}
                onChange={(e) => setTrainingForm({ ...trainingForm, name: e.target.value })}
                className="input-field"
                placeholder="e.g., combined_model_v1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Type</label>
              <select
                value={trainingForm.model_type}
                onChange={(e) => setTrainingForm({ ...trainingForm, model_type: e.target.value })}
                className="input-field"
              >
                <option value="combined">EMNIST Balanced (Digits + Alphabets, 47 classes)</option>
                <option value="digits">Digits Focus (EMNIST Balanced)</option>
                <option value="alphabets">Alphabets Focus (EMNIST Balanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Epochs</label>
              <input
                type="number"
                value={trainingForm.epochs}
                onChange={(e) => setTrainingForm({ ...trainingForm, epochs: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Batch Size</label>
              <input
                type="number"
                value={trainingForm.batch_size}
                onChange={(e) => setTrainingForm({ ...trainingForm, batch_size: parseInt(e.target.value) })}
                className="input-field"
                min="16"
                max="256"
                step="16"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Learning Rate</label>
              <input
                type="number"
                value={trainingForm.learning_rate}
                onChange={(e) => setTrainingForm({ ...trainingForm, learning_rate: parseFloat(e.target.value) })}
                className="input-field"
                min="0.0001"
                max="0.1"
                step="0.0001"
              />
            </div>

            <button
              type="submit"
              disabled={training}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5" />
              <span>{training ? 'Training...' : 'Start Training'}</span>
            </button>
          </form>

          {trainingProgress && (
            <div className="mt-6 p-4 bg-green-900 border border-green-700 rounded-lg">
              <h3 className="font-semibold mb-2">Training Completed!</h3>
              <div className="space-y-1 text-sm">
                <p>Accuracy: {(trainingProgress.metrics.accuracy * 100).toFixed(2)}%</p>
                <p>Precision: {(trainingProgress.metrics.precision * 100).toFixed(2)}%</p>
                <p>Recall: {(trainingProgress.metrics.recall * 100).toFixed(2)}%</p>
                <p>F1 Score: {(trainingProgress.metrics.f1_score * 100).toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Models List */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Brain className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Trained Models</h2>
          </div>

          {models.length > 0 ? (
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      model.is_deployed ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {model.is_deployed ? 'Deployed' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Type:</span> {model.model_type}
                    </div>
                    <div>
                      <span className="text-gray-400">Version:</span> {model.version}
                    </div>
                    <div>
                      <span className="text-gray-400">Accuracy:</span> {(model.accuracy * 100).toFixed(2)}%
                    </div>
                    <div>
                      <span className="text-gray-400">F1 Score:</span> {(model.f1_score * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {!model.is_deployed && (
                      <button
                        onClick={() => handleDeployModel(model.id)}
                        className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-1"
                      >
                        <Rocket className="h-4 w-4" />
                        <span>Deploy</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(model.id)}
                      className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1"
                    >
                      <History className="h-4 w-4" />
                      <span>History</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No trained models yet</p>
          )}
        </div>
      </div>

      {/* Training History Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Training History</h2>
              <button
                onClick={() => setSelectedModel(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Epoch</th>
                    <th className="text-left py-3 px-4">Training Loss</th>
                    <th className="text-left py-3 px-4">Training Accuracy</th>
                    <th className="text-left py-3 px-4">Validation Loss</th>
                    <th className="text-left py-3 px-4">Validation Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedModel.history.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-700">
                      <td className="py-3 px-4">{entry.epoch}</td>
                      <td className="py-3 px-4">{entry.training_loss.toFixed(4)}</td>
                      <td className="py-3 px-4">{(entry.training_accuracy * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4">{entry.validation_loss.toFixed(4)}</td>
                      <td className="py-3 px-4">{(entry.validation_accuracy * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTraining;
