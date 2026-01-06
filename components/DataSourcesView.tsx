import React, { useState } from 'react';
import { DataSource, ArticleAnalysis, AppSettings, AlertEntry } from '../types';
import { generateSocialScrapeBatch, analyzeArticle, generateAlertEmail, generateScanReport } from '../services/geminiService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ArticleCard from './ArticleCard';

interface DataSourcesViewProps {
  sources: DataSource[];
  onAddSource: (source: DataSource) => void;
  onDeleteSource: (id: string) => void;
  onArticlesFound?: (articles: ArticleAnalysis[]) => void;
  notify?: (message: string, type: 'success' | 'error' | 'info') => void;
  settings: AppSettings;
  onAddAlert: (alert: AlertEntry) => void;
}

const DataSourcesView: React.FC<DataSourcesViewProps> = ({ 
    sources, 
    onAddSource, 
    onDeleteSource, 
    onArticlesFound, 
    notify, 
    settings, 
    onAddAlert 
}) => {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPlatform, setNewPlatform] = useState<DataSource['platform']>('News Paper');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanData, setLastScanData] = useState<{articles: ArticleAnalysis[], summary: string} | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;
    const newSource: DataSource = {
      id: Date.now().toString(),
      name: newName,
      url: newUrl,
      platform: newPlatform,
      status: 'active',
      lastScraped: 'Pending...'
    };
    onAddSource(newSource);
    setNewName('');
    setNewUrl('');
  };

  const handleScan = async () => {
    setIsScanning(true);
    setLastScanData(null);
    if(notify) notify("Initiating social media & news scrape sequence...", 'info');
    
    try {
      const rawPosts = await generateSocialScrapeBatch(3, 'News Papers, Magazines, and Social Media');
      const analyzedResults: ArticleAnalysis[] = [];
      let alertCount = 0;

      for (const post of rawPosts) {
        const analysis = await analyzeArticle(post);
        analyzedResults.push(analysis);
        const isNegativeSentiment = ['Negative', 'Very Negative'].includes(analysis.sentiment_label);
        const isHighRisk = analysis.risk_category !== 'None' && analysis.risk_category !== undefined;

        if (isHighRisk || isNegativeSentiment) {
          alertCount++;
          if (settings.emailEnabled) {
              try {
                  const emailContent = await generateAlertEmail(analysis, settings.email);
                  onAddAlert({
                      id: Date.now().toString() + Math.random(),
                      timestamp: new Date().toISOString(),
                      recipient: settings.email,
                      subject: emailContent.subject,
                      body: emailContent.body,
                      riskLevel: analysis.risk_category,
                      source: analysis.source,
                      status: 'Sent'
                  });
              } catch (err) {
                  console.error("Failed to generate automated alert", err);
              }
          }
        }
      }

      const report = await generateScanReport(analyzedResults);
      setLastScanData({ articles: analyzedResults, summary: report });

      if (onArticlesFound) onArticlesFound(analyzedResults);

      if (notify) {
        if (alertCount > 0) notify(`SCAN COMPLETE: ${alertCount} Alerts Sent`, 'error');
        else notify(`Scan complete. ${analyzedResults.length} items processed.`, 'success');
      }

    } catch (error) {
        console.error(error);
        if(notify) notify("Scraping sequence failed. Check API connection.", 'error');
    } finally {
        setIsScanning(false);
    }
  };

  const getRiskChartData = (articles: ArticleAnalysis[]) => {
      const counts: Record<string, number> = {};
      articles.forEach(a => { counts[a.risk_category] = (counts[a.risk_category] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const RISK_COLORS: Record<string, string> = {
      'None': '#9CA3AF',
      'Religious Desecration': '#EF4444',
      'Hate Speech': '#F59E0B',
      'Public Incitement': '#B91C1C',
      'Ideological Subversion': '#7C3AED',
      'Misinformation': '#3B82F6'
  };

  return (
    <div className="space-y-6">
      
      {/* Scanner Control */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">Active Network Scanner</h2>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Autonomous agent scanning configured Newspapers, Magazines, and Social channels for sentiment anomalies and high-risk content.
                </p>
                {settings.emailEnabled && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Auto-Alerts Enabled
                    </div>
                )}
            </div>
            <button 
                onClick={handleScan}
                disabled={isScanning}
                className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 ${
                    isScanning 
                    ? 'bg-slate-600 cursor-wait' 
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-red-900/50'
                }`}
            >
                {isScanning ? (
                    <>
                         <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Scanning...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Start Scan
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Visual Feedback Section */}
      {lastScanData && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner animate-fade-in-down">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Scan Analysis Report</h3>
                    <p className="text-xs text-gray-500">Processed at {new Date().toLocaleTimeString()}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Executive Summary</h4>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">{lastScanData.summary}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                               <p className="text-xs text-gray-400 uppercase font-bold mb-1">Scanned</p>
                               <p className="text-2xl font-black text-gray-800">{lastScanData.articles.length}</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                               <p className="text-xs text-gray-400 uppercase font-bold mb-1">Threats</p>
                               <p className={`text-2xl font-black ${lastScanData.articles.filter(a => a.risk_category !== 'None').length > 0 ? 'text-red-600' : 'text-emerald-500'}`}>
                                   {lastScanData.articles.filter(a => a.risk_category !== 'None').length}
                               </p>
                           </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-64 flex flex-col">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Risk Distribution</h4>
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={getRiskChartData(lastScanData.articles)} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {getRiskChartData(lastScanData.articles).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#9CA3AF'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                          </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-64 flex flex-col">
                           <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Sentiment Spectrum</h4>
                           <div className="flex-1">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={lastScanData.articles.map(a => ({ name: a.source.slice(0,10), score: a.sentiment_score }))}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                     <XAxis dataKey="name" fontSize={10} hide />
                                     <YAxis domain={[-1, 1]} fontSize={10} />
                                     <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                     <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                        {lastScanData.articles.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.sentiment_score >= 0 ? '#10B981' : '#EF4444'} />
                                        ))}
                                     </Bar>
                                 </BarChart>
                             </ResponsiveContainer>
                           </div>
                      </div>
                  </div>
              </div>
              
              {lastScanData.articles.some(a => a.risk_category !== 'None') && (
                  <div className="mt-8">
                      <h4 className="text-sm font-bold text-red-700 uppercase mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                          Flagged High-Risk Content
                      </h4>
                      <div className="space-y-4">
                          {lastScanData.articles.filter(a => a.risk_category !== 'None').map(article => (
                              <ArticleCard key={article.article_id} article={article} />
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Add New Source */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Monitor New Target</h2>
        <form onSubmit={handleAdd} className="flex flex-col xl:flex-row gap-5 items-start xl:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Source Name</label>
            <input 
              type="text" 
              className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border transition-all text-gray-900 placeholder-gray-400 caret-blue-600"
              placeholder="e.g. Public Opinion Group"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="w-full xl:w-56">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Platform</label>
             <div className="relative">
                 <select 
                    value={newPlatform}
                    onChange={e => setNewPlatform(e.target.value as any)}
                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border transition-all text-gray-900 appearance-none pr-8 cursor-pointer"
                 >
                    <option value="News Paper">News Paper</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="X (Twitter)">X (Twitter)</option>
                    <option value="TikTok">TikTok</option>
                    <option value="RSS">RSS Feed</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                 </div>
             </div>
          </div>
          <div className="flex-[2] w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Target URL / ID</label>
            <input 
              type="text" 
              className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border transition-all text-gray-900 placeholder-gray-400 caret-blue-600"
              placeholder="https://..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full xl:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 h-[46px]"
          >
            Add Target
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">Monitored Channels</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
            {sources.length} Configured
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Last Check</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{source.name}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                           source.platform === 'Facebook' ? 'bg-blue-100 text-blue-800' :
                           source.platform === 'X (Twitter)' ? 'bg-gray-100 text-gray-800' :
                           source.platform === 'TikTok' ? 'bg-pink-100 text-pink-800' :
                           'bg-purple-100 text-purple-800'
                       }`}>
                           {source.platform}
                       </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{source.url}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      source.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                      source.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {source.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.lastScraped}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onDeleteSource(source.id)} className="text-red-600 hover:text-red-900 font-semibold text-xs border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;