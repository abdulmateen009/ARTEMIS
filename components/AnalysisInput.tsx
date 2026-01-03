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
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<ArticleAnalysis | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !source || !date) return;
    setStatus(ProcessingStatus.ANALYZING);
    try {
      const request: AnalysisRequest = { 
        text, 
        source, 
        date, 
        ip_address: ipAddress || 'Manual Input' 
      };
      const result = await analyzeArticle(request, useThinkingMode);
      setResultData(result);
      setShowResultModal(true);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleFinalize = (action: 'save' | 'next') => {
    if (resultData) onAnalysisComplete(resultData);
    setText('');
    setIpAddress('');
    setShowResultModal(false);
    setResultData(null);
  };

  const handleGenerateExample = async (platform: string) => {
    if (isGenerating || status === ProcessingStatus.ANALYZING) return;
    setIsGenerating(true);
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
      setText('Failed to generate example.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = status === ProcessingStatus.ANALYZING || isGenerating;
  const PLATFORMS = ['TechCrunch', 'Bloomberg', 'CNN', 'ESPN'];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 relative overflow-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-800">New Analysis</h2>
             <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">v2.1</span>
          </div>
          
          <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Quick Auto-fill</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                    <button
                        key={platform}
                        type="button"
                        onClick={() => handleGenerateExample(platform)}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
                    >
                        {platform}
                    </button>
                ))}
              </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Source Name</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border transition-all disabled:opacity-60 text-gray-900 placeholder-gray-400"
                placeholder="e.g. Bloomberg"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Date</label>
              <input
                type="date"
                required
                className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border transition-all disabled:opacity-60 text-gray-900 placeholder-gray-400"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Raw Article Content</label>
            <textarea
              required
              rows={6}
              className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border font-mono text-xs leading-relaxed transition-all resize-none disabled:opacity-60 text-gray-900 placeholder-gray-400"
              placeholder="Paste scraped text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
             {/* Thinking Toggle */}
            <div 
                onClick={() => !isLoading && setUseThinkingMode(!useThinkingMode)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    useThinkingMode ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
            >
                <div className="flex flex-col">
                    <span className={`text-sm font-bold ${useThinkingMode ? 'text-indigo-900' : 'text-gray-700'}`}>Deep Reasoning Mode</span>
                    <span className="text-[10px] text-gray-500">Gemini 3 Pro (High Latency)</span>
                </div>
                <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useThinkingMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useThinkingMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 rounded-xl py-3 px-6 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                    isLoading 
                    ? 'bg-blue-400 cursor-wait' 
                    : useThinkingMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
            >
                {isLoading ? (
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                )}
                {isLoading ? 'Processing...' : (useThinkingMode ? 'Analyze Deeply' : 'Run Analysis')}
            </button>
          </div>
        </form>
      </div>

      {/* RESULT MODAL */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => handleFinalize('save')}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-1.5 rounded-lg"><svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                 <h3 className="text-lg font-bold text-white">Analysis Complete</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${resultData.sentiment_score >= 0 ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 'bg-red-900/50 text-red-400 border-red-700/50'}`}>Sentiment: {resultData.sentiment_score.toFixed(2)}</div>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
               <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Source Information</p>
                      <h4 className="text-gray-900 font-bold text-lg">{resultData.source}</h4>
                      <p className="text-sm text-gray-500">{resultData.date}</p>
                  </div>
                  <div className="text-right">
                       <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Topic</p>
                       <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">{resultData.primary_topic}</span>
                  </div>
               </div>
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Content Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{resultData.summary}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div className={`p-4 rounded-xl border ${resultData.risk_category !== 'None' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                       <p className={`text-xs uppercase font-semibold mb-1 ${resultData.risk_category !== 'None' ? 'text-red-500' : 'text-green-500'}`}>Detected Risk</p>
                       <p className={`font-bold ${resultData.risk_category !== 'None' ? 'text-red-700' : 'text-green-700'}`}>{resultData.risk_category}</p>
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
            <div className="p-6 pt-2 bg-white border-t border-gray-100 flex gap-3">
               <button onClick={() => handleFinalize('save')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2">Save Result</button>
               <button onClick={() => handleFinalize('next')} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2">Next</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalysisInput;