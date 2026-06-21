import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { recognitionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eraser, Send } from 'lucide-react';
import EnsembleBadge from '../components/EnsembleBadge';

const CanvasDrawPage = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 400 });

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setCanvasSize({ 
          width: clientWidth, 
          // On mobile, use a square aspect ratio. On desktop, max height 400.
          height: Math.min(clientWidth, 400) 
        });
      }
    };
    
    // Initial size
    updateSize();
    
    // Add resize listener
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setResult(null);
    }
  };

  const handlePredict = async () => {
    if (canvasRef.current.isEmpty()) {
      toast.error('Please draw something first');
      return;
    }

    const canvas = canvasRef.current.getCanvas();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    setLoading(true);

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'drawing.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('input_method', 'canvas');

      const predictionResponse = await recognitionAPI.predict(formData);
      setResult(predictionResponse.data);
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
        <h1 className="page-title">Draw Character</h1>
        <p className="page-subtitle">Draw digits, letters, or words on the canvas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Canvas */}
        <div className="card animate-slide-up p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-muted">Canvas</h2>
            <button onClick={clearCanvas}
              className="flex items-center space-x-1.5 text-xs text-muted hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-all duration-200">
              <Eraser className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div ref={containerRef} className="bg-white rounded-xl overflow-hidden border border-surface-border touch-none w-full flex justify-center items-center">
            {canvasSize.width > 0 && (
              <SignatureCanvas
                ref={canvasRef}
                canvasProps={{ 
                  width: canvasSize.width, 
                  height: canvasSize.height, 
                  className: 'signature-canvas block w-full h-full touch-none' 
                }}
                penColor="#000000"
                minWidth={1.5}
                maxWidth={3}
                velocityFilterWeight={0.7}
              />
            )}
          </div>

          <button onClick={handlePredict} disabled={loading}
            className="w-full mt-4 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="h-4 w-4" />
            <span>{loading ? 'Analyzing...' : 'Predict'}</span>
          </button>
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
              <p className="text-muted text-xs sm:text-sm">Draw something and click Predict</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasDrawPage;
