import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import Plot from 'react-plotly.js';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

const Analytics = () => {
  const [characterFreqChart, setCharacterFreqChart] = useState(null);
  const [timelineChart, setTimelineChart] = useState(null);
  const [confidenceChart, setConfidenceChart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      const [freq, timeline, confidence] = await Promise.all([
        analyticsAPI.getCharacterFrequency(),
        analyticsAPI.getPredictionTimeline(),
        analyticsAPI.getConfidenceDistribution(),
      ]);

      setCharacterFreqChart(JSON.parse(freq.data.chart));
      setTimelineChart(JSON.parse(timeline.data.chart));
      setConfidenceChart(JSON.parse(confidence.data.chart));
    } catch (error) {
      console.error('Error fetching charts:', error);
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
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-400 mt-2">Visual insights into your character recognition data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Character Frequency Chart */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Character Frequency Distribution</h2>
          </div>
          {characterFreqChart && (
            <Plot
              data={characterFreqChart.data}
              layout={{
                ...characterFreqChart.layout,
                paper_bgcolor: '#1F2937',
                plot_bgcolor: '#1F2937',
                font: { color: '#ffffff' },
                margin: { t: 50, b: 50, l: 50, r: 20 },
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* Prediction Timeline Chart */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Predictions Over Time</h2>
          </div>
          {timelineChart && (
            <Plot
              data={timelineChart.data}
              layout={{
                ...timelineChart.layout,
                paper_bgcolor: '#1F2937',
                plot_bgcolor: '#1F2937',
                font: { color: '#ffffff' },
                margin: { t: 50, b: 50, l: 50, r: 20 },
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* Confidence Distribution Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Confidence Score Distribution</h2>
          </div>
          {confidenceChart && (
            <Plot
              data={confidenceChart.data}
              layout={{
                ...confidenceChart.layout,
                paper_bgcolor: '#1F2937',
                plot_bgcolor: '#1F2937',
                font: { color: '#ffffff' },
                margin: { t: 50, b: 50, l: 50, r: 20 },
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
