import React, { useState } from 'react';
import { AnalysisRequest, ProcessingStatus, ArticleAnalysis } from '../types';
import { analyzeArticle, generateMockArticle } from '../services/geminiService';

interface AnalysisInputProps {
  onAnalysisComplete: (result: ArticleAnalysis) => void;
  status: ProcessingStatus;
  setStatus: (status: ProcessingStatus) => void;
}

const AnalysisInput: React.FC<AnalysisInputProps> = ({ onAnalysisComplete, status, setStatus }) => {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ipAddress, setIpAddress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<ArticleAnalysis | null>(null);

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
      
      // Instead of completing immediately, show the modal
      setResultData(result);
      setShowResultModal(true);
      setStatus(ProcessingStatus.SUCCESS);
      
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleFinalize = (action: 'save' | 'next') => {
    if (resultData) {
      onAnalysisComplete(resultData);
    }

    // Clear the form text for both actions
    setText('');
    setIpAddress('');

    // If 'Next Analysis', we might keep the source/date as users often batch process from same source.
    // If 'Save', we also clear for a clean state, but user can re-enter.
    // To distinguish: let's clear everything on 'Save', but keep Source/Date on 'Next'.
    if (action === 'save') {
        // Optional: Clear source/date too? 
        // Let's keep source/date as it's less annoying.
    }

    setShowResultModal(false);
    setResultData(null);
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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
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

      {/* RESULT MODAL */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => handleFinalize('save')}></div>
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-1.5 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-bold text-white">Analysis Complete</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                 resultData.sentiment_score >= 0 
                  ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' 
                  : 'bg-red-900/50 text-red-400 border-red-700/50'
              }`}>
                  Sentiment: {resultData.sentiment_score.toFixed(2)}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
               
               {/* Source Info */}
               <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Source Information</p>
                      <h4 className="text-gray-900 font-bold text-lg">{resultData.source}</h4>
                      <p className="text-sm text-gray-500">{resultData.date}</p>
                  </div>
                  <div className="text-right">
                       <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Topic</p>
                       <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">
                          {resultData.primary_topic}
                       </span>
                  </div>
               </div>

               {/* Summary */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Content Summary
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {resultData.summary}
                  </p>
               </div>

               {/* Risk & Entities */}
               <div className="grid grid-cols-2 gap-4">
                   <div className={`p-4 rounded-xl border ${
                       resultData.risk_category !== 'None' 
                        ? 'bg-red-50 border-red-100' 
                        : 'bg-green-50 border-green-100'
                   }`}>
                       <p className={`text-xs uppercase font-semibold mb-1 ${
                           resultData.risk_category !== 'None' ? 'text-red-500' : 'text-green-500'
                       }`}>Detected Risk</p>
                       <p className={`font-bold ${
                           resultData.risk_category !== 'None' ? 'text-red-700' : 'text-green-700'
                       }`}>
                           {resultData.risk_category}
                       </p>
                   </div>
                   
                   <div className="p-4 rounded-xl border border-gray-100 bg-white">
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Key Entities</p>
                        <div className="flex flex-wrap gap-1">
                            {resultData.key_entities.slice(0,3).map((e, i) => (
                                <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{e}</span>
                            ))}
                        </div>
                   </div>
               </div>

            </div>

            {/* Modal Footer / Actions */}
            <div className="p-6 pt-2 bg-white border-t border-gray-100 flex gap-3">
               <button 
                  onClick={() => handleFinalize('save')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Result
               </button>
               
               <button 
                  onClick={() => handleFinalize('next')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Next Analysis
               </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AnalysisInput;