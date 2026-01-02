import React, { useState } from 'react';
import { DataSource, ArticleAnalysis, AppSettings, AlertEntry, SENTIMENT_COLORS } from '../types';
import { generateSocialScrapeBatch, analyzeArticle, generateAlertEmail, generateScanReport } from '../services/geminiService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ArticleCard from './ArticleCard';

interface DataSourcesViewProps {
  onArticlesFound?: (articles: ArticleAnalysis[]) => void;
  notify?: (message: string, type: 'success' | 'error' | 'info') => void;
  settings: AppSettings;
  onAddAlert: (alert: AlertEntry) => void;
}

const MOCK_SOURCES: DataSource[] = [
  { id: '1', name: 'Public News RSS', platform: 'RSS', url: 'https://news.google.com/rss', status: 'active', lastScraped: '10 mins ago' },
  { id: '2', name: 'Monitoring Page: Religious Debates', platform: 'Facebook', url: 'https://facebook.com/groups/debates', status: 'active', lastScraped: '1 hour ago' },
  { id: '3', name: 'Hashtag: #PublicOpinion', platform: 'X (Twitter)', url: 'https://x.com/search?q=public', status: 'active', lastScraped: '25 mins ago' },
];

const DataSourcesView: React.FC<DataSourcesViewProps> = ({ onArticlesFound, notify, settings, onAddAlert }) => {
  const [sources, setSources] = useState<DataSource[]>(MOCK_SOURCES);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPlatform, setNewPlatform] = useState<DataSource['platform']>('Facebook');
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
    setSources([...sources, newSource]);
    setNewName('');
    setNewUrl('');
  };

  const handleDelete = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleScan = async () => {
    setIsScanning(true);
    setLastScanData(null); // Reset previous results
    if(notify) notify("Initiating social media scrape sequence...", 'info');
    
    try {
      // 1. Simulate scraping diverse content from the configured platforms
      const rawPosts = await generateSocialScrapeBatch(3, 'Facebook, TikTok, and X');
      
      // 2. Analyze each post
      const analyzedResults: ArticleAnalysis[] = [];
      let highRiskCount = 0;

      for (const post of rawPosts) {
        const analysis = await analyzeArticle(post);
        analyzedResults.push(analysis);

        // Check for risk and trigger automated alert if email is enabled
        if (analysis.risk_category !== 'None' && analysis.risk_category !== undefined) {
          highRiskCount++;
          
          if (settings.emailEnabled) {
              try {
                  // Generate context-aware email body
                  const emailContent = await generateAlertEmail(analysis, settings.email);
                  
                  // Log the automated alert
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

      // 3. Generate Scan Report
      const report = await generateScanReport(analyzedResults);
      setLastScanData({
          articles: analyzedResults,
          summary: report
      });

      // 4. Update main app state
      if (onArticlesFound) {
        onArticlesFound(analyzedResults);
      }

      if (notify) {
        if (highRiskCount > 0) {
            notify(`SCAN COMPLETE: ${highRiskCount} High-Risk items detected!`, 'error');
        } else {
            notify(`Scan complete. ${analyzedResults.length} items processed.`, 'success');
        }
      }

    } catch (error) {
        console.error(error);
        if(notify) notify("Scraping sequence failed. Check API connection.", 'error');
    } finally {
        setIsScanning(false);
    }
  };

  // Helper for charts
  const getRiskChartData = (articles: ArticleAnalysis[]) => {
      const counts: Record<string, number> = {};
      articles.forEach(a => {
          counts[a.risk_category] = (counts[a.risk_category] || 0) + 1;
      });
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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Active Network Scanner</h2>
                <h3 className="text-emerald-400 font-semibold text-sm mb-0.5">AI News Intelligence & Sentiment Radar</h3>
                <p className="text-slate-400 text-xs italic mb-3">Transforming Real-Time Media Noise into Actionable Business Strategy</p>
                <p className="text-slate-300 text-sm">
                    Scrape configured public IDs, pages, and channels for sensitive content harmful to public thoughts or religious beliefs.
                    {settings.emailEnabled && (
                        <span className="block mt-1 text-emerald-400 text-xs font-semibold">
                            ✓ Auto-Alerts Enabled: Sending reports to {settings.email}
                        </span>
                    )}
                </p>
            </div>
            <button 
                onClick={handleScan}
                disabled={isScanning}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
                    isScanning 
                    ? 'bg-slate-600 cursor-wait' 
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-red-900/50'
                }`}
            >
                {isScanning ? (
                    <>
                         <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scanning Networks...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Scan & Analyze Now
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Visual Feedback Section - Only shows after scan */}
      {lastScanData && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner animate-fade-in-down">
              <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Live Scan Results & Analysis</h3>
                    <p className="text-xs text-gray-500">Processing timestamp: {new Date().toLocaleTimeString()}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Summary Column */}
                  <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Executive Summary</h4>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">
                              {lastScanData.summary}
                          </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-2 gap-4">
                           <div>
                               <p className="text-xs text-gray-400 uppercase">Items Scanned</p>
                               <p className="text-2xl font-bold text-gray-800">{lastScanData.articles.length}</p>
                           </div>
                           <div>
                               <p className="text-xs text-gray-400 uppercase">Threats Found</p>
                               <p className={`text-2xl font-bold ${lastScanData.articles.filter(a => a.risk_category !== 'None').length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                   {lastScanData.articles.filter(a => a.risk_category !== 'None').length}
                               </p>
                           </div>
                      </div>
                  </div>

                  {/* Charts Column */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-64">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 text-center">Detected Risks</h4>
                          <ResponsiveContainer width="100%" height="90%">
                              <PieChart>
                                  <Pie
                                      data={getRiskChartData(lastScanData.articles)}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={60}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {getRiskChartData(lastScanData.articles).map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#9CA3AF'} />
                                      ))}
                                  </Pie>
                                  <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-64">
                           <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 text-center">Sentiment Distribution</h4>
                           <ResponsiveContainer width="100%" height="90%">
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
              
              {/* Flagged Items List */}
              {lastScanData.articles.some(a => a.risk_category !== 'None') && (
                  <div className="mt-6">
                      <h4 className="text-sm font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Monitor New Target</h2>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Page/Channel Name</label>
            <input 
              type="text" 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="e.g. Public Opinion Group"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="w-full md:w-40">
             <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
             <select 
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value as any)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
             >
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="TikTok">TikTok</option>
                <option value="RSS">RSS Feed</option>
             </select>
          </div>
          <div className="flex-[2] w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target URL / ID</label>
            <input 
              type="text" 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="https://facebook.com/groups/..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            Add Target
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Monitored Channels</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {sources.length} Configured
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Scraped</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{source.name}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                           source.platform === 'Facebook' ? 'bg-blue-100 text-blue-800' :
                           source.platform === 'X (Twitter)' ? 'bg-gray-100 text-gray-800' :
                           source.platform === 'TikTok' ? 'bg-pink-100 text-pink-800' :
                           'bg-purple-100 text-purple-800'
                       }`}>
                           {source.platform}
                       </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={source.url}>{source.url}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      source.status === 'active' ? 'bg-green-100 text-green-800' : 
                      source.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.lastScraped}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(source.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No monitoring targets configured. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;