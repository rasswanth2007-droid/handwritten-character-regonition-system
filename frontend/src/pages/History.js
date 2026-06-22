import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [correction, setCorrection] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/recognition/predictions/');
      // Django returns paginated results { count, next, previous, results: [...] }
      const data = response.data.results || response.data;
      setPredictions(data);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (id, isCorrect, actualCharacter = null) => {
    try {
      const payload = { is_correct: isCorrect };
      if (!isCorrect && actualCharacter) {
        payload.actual_character = actualCharacter;
      }
      
      await api.put(`/api/recognition/predictions/${id}/feedback/`, payload);
      toast.success(isCorrect ? 'Thanks for the feedback!' : 'Correction saved!');
      
      // Update local state to reflect change
      setPredictions(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            is_correct: isCorrect,
            predicted_character: actualCharacter || p.predicted_character,
            confidence_score: isCorrect ? p.confidence_score : 1.0,
          };
        }
        return p;
      }));
      setEditingId(null);
      setCorrection('');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <Clock className="h-7 w-7 text-accent" />
            My History
          </h1>
          <p className="text-muted text-sm">Review your past predictions and help train the AI.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-xl border border-accent/20">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">{predictions.length} Total</span>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No history yet</h3>
          <p className="text-muted mb-6">Draw or upload an image to see your history here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((item) => (
            <div key={item.id} className="card group hover:border-accent/30 transition-all duration-300 flex flex-col h-full">
              {/* Image Section */}
              <div className="aspect-square bg-white rounded-xl mb-4 overflow-hidden flex items-center justify-center p-4 border border-surface-border">
                <img 
                  src={item.image.startsWith('/') ? `${process.env.REACT_APP_API_URL || 'https://handwritten-character-regonition-system.onrender.com'}${item.image}` : item.image} 
                  alt="Prediction input" 
                  className="max-w-full max-h-full object-contain filter invert opacity-90 group-hover:scale-105 transition-transform duration-500" 
                />
              </div>

              {/* Data Section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-surface-hover rounded-md text-muted capitalize">
                    {item.input_method}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-4">
                  <div className="text-4xl font-bold text-white">{item.predicted_character}</div>
                  <div className="text-sm font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                    {(item.confidence_score * 100).toFixed(1)}% Confident
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="mt-auto pt-4 border-t border-surface-border">
                  {item.is_correct === true ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 p-2 rounded-lg justify-center">
                      <CheckCircle2 className="h-4 w-4" /> Validated by you
                    </div>
                  ) : item.is_correct === false ? (
                    <div className="flex items-center gap-2 text-accent text-sm font-medium bg-accent/10 p-2 rounded-lg justify-center">
                      <Sparkles className="h-4 w-4" /> AI Corrected to '{item.predicted_character}'
                    </div>
                  ) : editingId === item.id ? (
                    <div className="animate-fade-in space-y-2">
                      <p className="text-xs text-muted mb-1 text-center">What was the correct character?</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={10}
                          value={correction}
                          onChange={(e) => setCorrection(e.target.value)}
                          className="input-field py-1 text-center font-bold text-lg h-9"
                          placeholder="e.g. A"
                          autoFocus
                        />
                        <button 
                          onClick={() => submitFeedback(item.id, false, correction)}
                          disabled={!correction}
                          className="bg-accent text-white px-3 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="w-full text-xs text-muted hover:text-white py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted mb-2 text-center">Was this correct?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => submitFeedback(item.id, true)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface-hover hover:bg-emerald-500/20 hover:text-emerald-400 text-muted transition-colors text-sm font-medium"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Yes
                        </button>
                        <button 
                          onClick={() => setEditingId(item.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface-hover hover:bg-red-500/20 hover:text-red-400 text-muted transition-colors text-sm font-medium"
                        >
                          <XCircle className="h-4 w-4" /> No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
