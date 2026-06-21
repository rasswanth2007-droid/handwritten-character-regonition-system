import React, { useState } from 'react';
import { recognitionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, X, Send } from 'lucide-react';
import EnsembleBadge from '../components/EnsembleBadge';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('input_method', 'upload');

      const response = await recognitionAPI.predict(formData);
      setResult(response.data);
      toast.success('Prediction completed!');
    } catch (error) {
      toast.error('Prediction failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isMultiChar = result && result.predicted_character && result.predicted_character.length > 1;

  return (
    <div className="page-container">
      <div className="mb-4 sm:mb-6">
        <h1 className="page-title">Upload Image</h1>
        <p className="page-subtitle">Upload an image containing handwritten text</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upload */}
        <div className="card animate-slide-up p-4 sm:p-6">
          <h2 className="text-sm font-medium text-muted mb-4">Image</h2>

          {!selectedFile ? (
            <div className="border border-dashed border-surface-border rounded-xl p-8 sm:p-12 text-center hover:border-accent/30 hover:bg-accent/5 transition-all duration-300 cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted/40 mx-auto mb-3" />
                <p className="text-xs sm:text-sm font-medium mb-1">Click to upload</p>
                <p className="text-[10px] sm:text-xs text-muted">PNG, JPG (max 5MB)</p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <img src={preview} alt="Preview"
                  className="w-full h-auto rounded-xl border border-surface-border" />
                <button onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-surface-card/80 backdrop-blur-sm hover:bg-red-500/20 text-muted hover:text-red-400 rounded-lg p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 border border-surface-border">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex space-x-2">
                <button onClick={handleRemoveFile} className="flex-1 btn-secondary text-xs sm:text-sm">
                  Remove
                </button>
                <button onClick={handlePredict} disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{loading ? 'Analyzing...' : 'Predict'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="card animate-slide-up p-4 sm:p-6" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-medium text-muted mb-4">Result</h2>

          {result ? (
            <div className="space-y-5 animate-fade-in">
              {/* Main prediction */}
              <div className="text-center py-4">
                {isMultiChar ? (
                  <div>
                    <div className="bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 inline-block mb-3 max-w-full overflow-hidden">
                      <span className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-white break-words">
                        {result.predicted_character}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {result.num_characters || result.predicted_character.length} character(s)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-bold mx-auto mb-3 text-white">
                      {result.predicted_character}
                    </div>
                    <p className="text-xs text-muted">Predicted Character</p>
                  </div>
                )}
                <p className="text-xs text-muted mt-2">
                  Confidence: {(result.confidence_score * 100).toFixed(1)}%
                </p>
                <EnsembleBadge result={result} />
              </div>

              {/* Per-character breakdown — only when PyTorch is final */}
              {result.correction_source !== 'gemini' && result.lines && result.lines.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted mb-2">Per-Character</h3>
                  {result.lines.map((line, lineIdx) => (
                    <div key={lineIdx} className="mb-2">
                      {result.lines.length > 1 && (
                        <p className="text-xs text-muted/60 mb-1">Line {lineIdx + 1}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {line.text.split('').map((char, charIdx) => (
                          <div key={charIdx}
                            className="flex flex-col items-center p-1.5 sm:p-2 bg-surface rounded-lg min-w-[2rem] sm:min-w-[2.5rem] border border-surface-border">
                            <span className="text-base sm:text-lg font-semibold">{char}</span>
                            <span className="text-[9px] sm:text-[10px] text-muted">
                              {(line.confidences[charIdx] * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top predictions */}
              <div>
                <h3 className="text-xs font-medium text-muted mb-2">Top Predictions</h3>
                <div className="space-y-1.5">
                  {Object.entries(result.top_predictions)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([char, confidence]) => (
                      <div key={char} className="flex items-center justify-between p-2 sm:p-2.5 bg-surface rounded-lg border border-surface-border">
                        <span className="text-sm font-semibold font-mono">{char}</span>
                        <span className="text-[10px] sm:text-xs text-accent">{(confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-muted text-xs sm:text-sm">Upload an image and click Predict</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
