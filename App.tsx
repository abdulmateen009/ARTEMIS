import React, { useState, useEffect } from 'react';
import { ArticleAnalysis, ProcessingStatus, AppSettings, AlertEntry, DataSource, DocumentationFile } from './types';
import AnalysisInput from './components/AnalysisInput';
import ArticleCard from './components/ArticleCard';
import DashboardStats from './components/DashboardStats';
import DataSourcesView from './components/DataSourcesView';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import AlertsView from './components/AlertsView';
import UsageGuideView from './components/UsageGuideView';
import EcommerceView from './components/EcommerceView';
import { supabase } from './services/supabaseClient';

type View = 'dashboard' | 'datasources' | 'alerts' | 'settings' | 'history' | 'usage' | 'ecommerce';
type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
}

const REQUIRED_SQL = `
-- Run this in your Supabase SQL Editor to fix the missing table error
create table if not exists public.news_sentiment_table (
  article_id uuid not null primary key,
  created_at timestamp with time zone default now(),
  source text,
  url text,
  ip_address text,
  date text,
  summary text,
  primary_topic text,
  sentiment_score double precision,
  sentiment_label text,
  risk_category text,
  key_entities text[],
  "references" jsonb,
  original_post_content text,
  alert_summary text
);

alter table public.news_sentiment_table enable row level security;

create policy "Enable read access for all users"
on public.news_sentiment_table for select to public using (true);

create policy "Enable insert access for all users"
on public.news_sentiment_table for insert to public with check (true);
`;

const INITIAL_SOURCES: DataSource[] = [
  { id: '1', name: 'Public News RSS', platform: 'RSS', url: 'https://news.google.com/rss', status: 'active', lastScraped: '10 mins ago' },
  { id: '2', name: 'The Daily Times', platform: 'News Paper', url: 'https://dailytimes.example.com', status: 'active', lastScraped: '5 mins ago' },
  { id: '3', name: 'Tech Weekly', platform: 'Magazine', url: 'https://techweekly.example.com', status: 'active', lastScraped: '1 hour ago' },
  { id: '4', name: 'Monitoring Page: Religious Debates', platform: 'Facebook', url: 'https://facebook.com/groups/debates', status: 'active', lastScraped: '1 hour ago' },
  { id: '5', name: 'Hashtag: #PublicOpinion', platform: 'X (Twitter)', url: 'https://x.com/search?q=public', status: 'active', lastScraped: '25 mins ago' },
];

const App: React.FC = () => {
  const [articles, setArticles] = useState<ArticleAnalysis[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [dbError, setDbError] = useState<boolean>(false);
  const [showSqlSetup, setShowSqlSetup] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // -- PERSISTENT STATE MANAGEMENT --
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('artemis_settings');
    return saved ? JSON.parse(saved) : {
      email: 'analyst@company.com',
      emailEnabled: true,
      sensitivity: 'medium'
    };
  });

  // Alerts
  const [alerts, setAlerts] = useState<AlertEntry[]>(() => {
    const saved = localStorage.getItem('artemis_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Data Sources
  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    const saved = localStorage.getItem('artemis_dataSources');
    return saved ? JSON.parse(saved) : INITIAL_SOURCES;
  });

  // Documents
  const [docs, setDocs] = useState<DocumentationFile[]>(() => {
    const saved = localStorage.getItem('artemis_docs');
    return saved ? JSON.parse(saved) : [];
  });

  // -- PERSISTENCE EFFECTS --
  useEffect(() => { localStorage.setItem('artemis_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('artemis_alerts', JSON.stringify(alerts)); }, [alerts]);
  useEffect(() => { localStorage.setItem('artemis_dataSources', JSON.stringify(dataSources)); }, [dataSources]);
  useEffect(() => { localStorage.setItem('artemis_docs', JSON.stringify(docs)); }, [docs]);


  // Load data from Supabase on initial mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('news_sentiment_table')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          const errMsg = error.message || JSON.stringify(error);
          console.error('Error fetching Supabase history:', errMsg);
          
          if (errMsg.includes('Could not find the table') || errMsg.includes('relation "public.news_sentiment_table" does not exist')) {
            setDbError(true);
          }
          return;
        }

        if (data && data.length > 0) {
          const mappedArticles: ArticleAnalysis[] = data.map((row: any) => ({
            article_id: row.article_id || 'unknown',
            source: row.source || 'Unknown Source',
            url: row.url || '',
            date: row.date || new Date().toISOString().split('T')[0],
            summary: row.summary || 'No summary available',
            primary_topic: row.primary_topic || 'Other',
            sentiment_score: row.sentiment_score ?? 0,
            sentiment_label: row.sentiment_label || 'Neutral',
            risk_category: row.risk_category || 'None',
            key_entities: row.key_entities || [],
            references: row.references || [],
            ip_address: row.ip_address,
            original_post_content: row.original_post_content
          }));
          setArticles(mappedArticles);
        }
      } catch (err) {
        console.error('Failed to load history:', err instanceof Error ? err.message : String(err));
      }
    };

    fetchHistory();
  }, []);

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, duration);
  };

  const handleAnalysisComplete = (result: ArticleAnalysis) => {
    setArticles(prev => [result, ...prev]);
  };

  const handleBatchAnalysisComplete = (results: ArticleAnalysis[]) => {
    setArticles(prev => [...results, ...prev]);
  };

  const handleClearData = () => {
    setArticles([]);
    setAlerts([]); // This will also clear local storage via the effect
    showNotification('System cache and history cleared', 'info');
  };
  
  // --- ALERT MANAGEMENT ---
  const handleAddAlert = (alert: AlertEntry) => {
      setAlerts(prev => [alert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showNotification('Alert log deleted successfully', 'info');
  };

  // --- DATA SOURCE MANAGEMENT ---
  const handleAddSource = (source: DataSource) => {
    setDataSources(prev => [...prev, source]);
    showNotification('New data source target added', 'success');
  };

  const handleDeleteSource = (id: string) => {
    setDataSources(prev => prev.filter(s => s.id !== id));
    showNotification('Data source target removed', 'info');
  };

  // --- DOCUMENT MANAGEMENT ---
  const handleUploadDoc = (doc: DocumentationFile) => {
    setDocs(prev => [doc, ...prev]);
    showNotification('Document uploaded and saved', 'success');
  };

  const handleDeleteDoc = (id: string) => {
    const docToDelete = docs.find(d => d.id === id);
    setDocs(prev => prev.filter(d => d.id !== id));
    showNotification(`Document "${docToDelete?.name || 'File'}" deleted permanently`, 'info');
  };

  const NavItem = ({ view, label, isNew }: { view: View, label: string, isNew?: boolean }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full text-left flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span>{label}</span>
      {isNew && (
        <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 shadow-sm">
          NEW
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* DB Error Modal */}
      {dbError && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-600 text-white p-4 z-[70] flex flex-col md:flex-row items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Database Table Missing</p>
              <p className="text-sm opacity-90">The table <code>news_sentiment_table</code> was not found in your Supabase project.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowSqlSetup(true)} className="bg-white text-orange-700 px-4 py-2 rounded font-medium text-sm hover:bg-orange-50">View SQL Fix</button>
             <button onClick={() => setDbError(false)} className="text-white hover:bg-orange-700 px-3 py-2 rounded">Dismiss</button>
          </div>
        </div>
      )}

      {/* SQL Setup Modal */}
      {showSqlSetup && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Database Setup Required</h3>
              <button onClick={() => setShowSqlSetup(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-gray-600 mb-4">Run the following SQL query in your Supabase Dashboard:</p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto">{REQUIRED_SQL}</pre>
                <button 
                  onClick={() => { navigator.clipboard.writeText(REQUIRED_SQL); showNotification("SQL copied!", "success"); }}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button onClick={() => setShowSqlSetup(false)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[90] animate-fade-in-down w-full max-w-sm px-4 md:px-0">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 text-white ${
            notification.type === 'success' ? 'bg-emerald-600' :
            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
             {notification.type === 'success' && <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
             {notification.type === 'error' && <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
             <p className="font-medium text-sm flex-1">{notification.message}</p>
             <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex-shrink-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            {/* LOGO REPLACEMENT */}
            <svg className="w-10 h-10 shrink-0 shadow-lg shadow-blue-500/20 rounded-xl" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2563EB"/>
              <path d="M20 9L29 31H11L20 9Z" fill="white" fillOpacity="0.1"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M20 12L26 27H14L20 12ZM20 17L22 22H18L20 17Z" fill="white"/>
              <circle cx="20" cy="9" r="2.5" fill="#93C5FD"/>
              <circle cx="11" cy="31" r="2.5" fill="#93C5FD"/>
              <circle cx="29" cy="31" r="2.5" fill="#93C5FD"/>
            </svg>
          
            <div>
               <h1 className="text-xl font-bold tracking-tight">ARTEMIS</h1>
               <p className="text-xs text-slate-400">Intelligence System</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <NavItem view="dashboard" label="Dashboard" />
            <NavItem view="ecommerce" label="E-Commerce Intel" />
            <NavItem view="datasources" label="Data Sources" />
            <NavItem view="history" label="History Log" />
            <NavItem view="alerts" label="Alerts" />
            <NavItem view="usage" label="Usage Guide" />
            <div className="pt-4 mt-4 border-t border-slate-800">
               <NavItem view="settings" label="Settings" />
            </div>
          </nav>
        </div>
        
        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-xs text-slate-400 font-medium">System Operational</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">v2.4.0 • Gemini 3 Pro</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
         
         {/* Mobile Header */}
         <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-30 shrink-0">
             <div className="flex items-center gap-2">
                 {/* MOBILE LOGO REPLACEMENT */}
                 <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="10" fill="#2563EB"/>
                    <path d="M20 9L29 31H11L20 9Z" fill="white" fillOpacity="0.1"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M20 12L26 27H14L20 12ZM20 17L22 22H18L20 17Z" fill="white"/>
                    <circle cx="20" cy="9" r="2.5" fill="#93C5FD"/>
                    <circle cx="11" cy="31" r="2.5" fill="#93C5FD"/>
                    <circle cx="29" cy="31" r="2.5" fill="#93C5FD"/>
                 </svg>
                 <span className="font-bold text-gray-900">ARTEMIS</span>
             </div>
             <button 
                 onClick={() => setIsSidebarOpen(true)} 
                 className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
             >
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
             </button>
         </header>

         {/* Scrollable Main View */}
         <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 hidden md:flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {currentView === 'dashboard' && 'Intelligence Dashboard'}
                        {currentView === 'ecommerce' && 'E-Commerce Analysis'}
                        {currentView === 'history' && 'Analysis History'}
                        {currentView === 'datasources' && 'Data Sources'}
                        {currentView === 'alerts' && 'Alert Configuration'}
                        {currentView === 'usage' && 'Documentation'}
                        {currentView === 'settings' && 'System Settings'}
                        </h1>
                        <p className="text-gray-500 mt-2">
                        {currentView === 'dashboard' && 'Real-time sentiment monitoring and risk detection'}
                        {currentView === 'ecommerce' && 'Market trends, platform metrics, and product reviews'}
                        {currentView === 'history' && 'Complete archive of analyzed events'}
                        {currentView === 'datasources' && 'Configure social media feeds and news scrapers'}
                        {currentView === 'alerts' && 'Manage automated security notifications'}
                        {currentView === 'usage' && 'Project guides and operational manuals'}
                        {currentView === 'settings' && 'Manage preferences and data retention'}
                        </p>
                    </div>
                    <div className="text-right hidden lg:block bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Current Session</div>
                        <div className="text-sm font-medium text-gray-700">
                            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {currentView === 'dashboard' && (
                <>
                    <DashboardStats articles={articles} />
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-1">
                            <div className="sticky top-8">
                                <AnalysisInput 
                                    onAnalysisComplete={handleAnalysisComplete} 
                                    status={status}
                                    setStatus={setStatus}
                                />
                                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl">
                                    <div className="flex gap-3 mb-2">
                                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 h-fit">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h4 className="text-blue-900 font-bold text-sm pt-0.5">Quick Guide</h4>
                                    </div>
                                    <p className="text-blue-800 text-xs leading-relaxed opacity-80">
                                        Input raw article text or use auto-fill for testing. The system utilizes Gemini to extract structured intelligence, sentiment scores, and risk factors.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">Recent Feed</h2>
                                <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    {articles.length} Items Analyzed
                                </span>
                            </div>

                            {articles.length === 0 ? (
                                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-gray-900 font-medium mb-1">Feed is Empty</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Use the analysis panel to process your first article or event.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {articles.map((article) => (
                                        <ArticleCard key={article.article_id} article={article} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
                )}

                {currentView === 'ecommerce' && <EcommerceView />}
                {currentView === 'history' && <HistoryView articles={articles} />}
                {currentView === 'datasources' && (
                    <DataSourcesView 
                        sources={dataSources}
                        onAddSource={handleAddSource}
                        onDeleteSource={handleDeleteSource}
                        onArticlesFound={handleBatchAnalysisComplete}
                        notify={showNotification}
                        settings={settings}
                        onAddAlert={handleAddAlert}
                    />
                )}
                {currentView === 'settings' && (
                    <SettingsView 
                        articles={articles}
                        onClearData={handleClearData} 
                        onImportData={(data, mode) => {
                            if (mode === 'replace') setArticles(data);
                            else setArticles(prev => [...data, ...prev]);
                        }}
                        notify={showNotification}
                        settings={settings}
                        onUpdateSettings={setSettings}
                    />
                )}
                {currentView === 'alerts' && <AlertsView alerts={alerts} onDeleteAlert={handleDeleteAlert} />}
                {currentView === 'usage' && (
                  <UsageGuideView 
                    docs={docs}
                    onUploadDoc={handleUploadDoc}
                    onDeleteDoc={handleDeleteDoc}
                  />
                )}
            </div>
         </main>
      </div>
    </div>
  );
};

export default App;