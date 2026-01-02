import React, { useState } from 'react';
import { AnalysisRequest, ProcessingStatus } from '../types';
import { analyzeArticle, generateMockArticle } from '../services/geminiService';

interface AnalysisInputProps {
  onAnalysisComplete: (result: any) => void;
  status: ProcessingStatus;
  setStatus: (status: ProcessingStatus) => void;
}

const AnalysisInput: React.FC<AnalysisInputProps> = ({ onAnalysisComplete, status, setStatus }) => {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ipAddress, setIpAddress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !source || !date) return;

    setStatus(ProcessingStatus.ANALYZING);

    try {
      // If ipAddress state is empty (manual typing), label it as Manual Entry. 
      // If it was populated by the "Auto-fill" buttons (simulated scrape), use that.
      const request: AnalysisRequest = { 
        text, 
        source, 
        date, 
        ip_address: ipAddress || 'Manual Input / Direct Entry' 
      };
      const result = await analyzeArticle(request);
      onAnalysisComplete(result);
      setStatus(ProcessingStatus.SUCCESS);
      // Optional: Clear form or leave it
      setText('');
      setIpAddress('');
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleGenerateExample = async (platform: string) => {
    if (isGenerating || status === ProcessingStatus.ANALYZING) return;
    
    setIsGenerating(true);
    // Clear current fields to show something is happening
    setText('Generating example content with Gemini...');
    setSource(platform);
    
    try {
      const result = await generateMockArticle(platform);
      setText(result.text);
      setSource(result.source);
      setDate(result.date);
      setIpAddress(result.ip_address || '192.168.1.100');
    } catch (error) {
      console.error(error);
      setText('Failed to generate example. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = status === ProcessingStatus.ANALYZING || isGenerating;
  const PLATFORMS = ['TechCrunch', 'Bloomberg', 'CNN', 'ESPN', 'Nature'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-gray-800">New Analysis</h2>
        
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Auto-fill:</span>
            {PLATFORMS.map(platform => (
                <button
                    key={platform}
                    type="button"
                    onClick={() => handleGenerateExample(platform)}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {platform}
                </button>
            ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
            <input
              type="text"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g. Bloomberg, TechCrunch"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-50 disabled:text-gray-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Raw Article Text</label>
          <textarea
            required
            rows={6}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono text-xs disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Paste the full text of the scraped article here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end">
          {status === ProcessingStatus.ERROR && (
            <span className="text-red-500 text-sm mr-4">Analysis failed. Please try again.</span>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isLoading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {status === ProcessingStatus.ANALYZING ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing with Gemini...
              </>
            ) : isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Example...
              </>
            ) : (
              'Analyze Article'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnalysisInput;