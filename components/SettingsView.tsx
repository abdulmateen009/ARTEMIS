import React, { useRef, useState } from 'react';
import { ArticleAnalysis, AppSettings } from '../types';

interface SettingsViewProps {
  articles: ArticleAnalysis[];
  onClearData: () => void;
  onImportData: (data: ArticleAnalysis[], mode: 'merge' | 'replace') => void;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    articles, 
    onClearData, 
    onImportData, 
    notify,
    settings,
    onUpdateSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Admin Security State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowAuthScreen(true);
      setPassword('');
      setAuthError('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin009') {
      setIsAdmin(true);
      setShowAuthScreen(false);
      setAuthError('');
    } else {
      setAuthError('Access Denied: Invalid Security Credentials');
      setPassword('');
    }
  };

  const handleCancelAuth = () => {
    setShowAuthScreen(false);
    setPassword('');
    setAuthError('');
  };

  const handleExport = () => {
    if (articles.length === 0) {
        notify('No data available to export.', 'error');
        return;
    }
    const dataStr = JSON.stringify(articles, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artemis_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Export started successfully.', 'info');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        if (Array.isArray(parsedData)) {
           if (parsedData.length > 0 && !parsedData[0].article_id) {
             notify('File content does not match expected format.', 'error');
             return;
           }
           onImportData(parsedData, 'merge');
           notify(`Successfully imported ${parsedData.length} articles.`, 'success');
        } else {
            notify('Invalid file format. Expected an array of articles.', 'error');
        }
      } catch (error) {
        console.error(error);
        notify('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            notify('Image size too large. Max 2MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                onUpdateSettings({ ...settings, customLogo: event.target.result as string });
                notify('System logo updated successfully', 'success');
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset
    if(e.target) e.target.value = '';
  };

  const handleClearRequest = () => {
    if (articles.length === 0) {
        notify('No data to clear.', 'info');
        return;
    }
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
      onClearData();
      notify('All analysis history has been permanently deleted.', 'success');
      setShowClearConfirm(false);
  };

  const sensitivityOptions = [
    {
      id: 'low',
      label: 'Low Sensitivity',
      badge: 'Critical Only',
      description: 'Only triggers alerts for "Very Negative" content. Best for minimizing noise and focusing purely on crisis management.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'medium',
      label: 'Medium Sensitivity',
      badge: 'Standard',
      description: 'Triggers alerts for "Negative" and "Very Negative" content. The recommended balance for staying informed without getting overwhelmed.',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'high',
      label: 'High Sensitivity',
      badge: 'Strict Watch',
      description: 'Triggers alerts for "Neutral" content and below. Use this for strict surveillance where even a slight dip in sentiment matters.',
      color: 'bg-red-50 text-red-700 border-red-200'
    }
  ];

  return (
    <div className="max-w-4xl space-y-8 relative">
      
      {/* CLEAR DATA CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Clear All History?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete all <span className="font-bold">{articles.length}</span> analyzed articles? This action <span className="font-bold text-red-600">cannot be undone</span>.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={confirmClear}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-bold text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Yes, Clear Everything
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Gateway Overlay */}
      {showAuthScreen && (
         <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4 animate-fade-in-down">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 border-b border-gray-200 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Security Clearance Required</h3>
                    <p className="text-sm text-gray-500 text-center mt-2">
                       This section is restricted to authorized personnel only. Please verify your identity.
                    </p>
                </div>
                
                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Admin Password</label>
                        <input 
                          type="password" 
                          autoFocus
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-900 text-white placeholder-gray-500 caret-white"
                          placeholder="••••••••"
                        />
                        {authError && (
                            <p className="text-red-600 text-xs font-bold mt-2 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {authError}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                           type="button" 
                           onClick={handleCancelAuth}
                           className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                           type="submit" 
                           className="flex-[2] px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-transform active:scale-95"
                        >
                            Authenticate Access
                        </button>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400">Demo Access: Use password <span className="font-mono bg-gray-100 px-1 rounded">admin009</span></p>
                    </div>
                </form>
            </div>
         </div>
       )}

      {/* Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Notification Preferences</h2>
            <p className="text-sm text-gray-500">Manage how and when you receive alerts.</p>
          </div>

           {/* Admin Toggle */}
             <div 
               onClick={handleAdminToggle}
               className={`flex items-center cursor-pointer select-none px-4 py-2 rounded-lg border transition-all duration-200 group ${isAdmin ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
             >
                <div className={`mr-3 font-bold text-xs uppercase tracking-wider transition-colors ${isAdmin ? 'text-red-700' : 'text-gray-500'}`}>
                  {isAdmin ? 'Admin Access: UNLOCKED' : 'Admin Access: LOCKED'}
                </div>
                <div className="relative h-6 w-10">
                  <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${isAdmin ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 flex items-center justify-center ${isAdmin ? 'transform translate-x-4' : ''}`}>
                      {isAdmin ? (
                          <svg className="w-2.5 h-2.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                          <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      )}
                  </div>
                </div>
             </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Alerts</label>
              <p className="text-sm text-gray-500">Receive instant automated notifications for high-risk articles found during scans.</p>
            </div>
            <button 
              onClick={() => isAdmin && onUpdateSettings({...settings, emailEnabled: !settings.emailEnabled})}
              disabled={!isAdmin}
              title={!isAdmin ? "Admin access required" : ""}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'} ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              role="switch"
              aria-checked={settings.emailEnabled}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Email Address</label>
            <input 
              type="email" 
              value={settings.email}
              onChange={(e) => onUpdateSettings({...settings, email: e.target.value})}
              disabled={!settings.emailEnabled || !isAdmin}
              className={`w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border bg-gray-900 text-white placeholder-gray-500 caret-white disabled:bg-gray-100 disabled:text-gray-400 disabled:caret-gray-500 transition-colors ${!isAdmin && settings.emailEnabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* System Branding (Logo Upload) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">System Branding</h2>
            <p className="text-sm text-gray-500">Customize the application identity and logo.</p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="shrink-0">
                {settings.customLogo ? (
                    <img src={settings.customLogo} alt="Current Logo" className="w-20 h-20 rounded-xl object-cover shadow-md border border-gray-100 bg-white" />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                         <span className="text-white font-bold text-3xl">A</span>
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Application Logo</h3>
                <div className="flex gap-3 flex-wrap">
                    <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Upload New Image
                    </button>
                    {settings.customLogo && (
                        <button 
                            onClick={() => onUpdateSettings({ ...settings, customLogo: undefined })}
                            className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                        >
                            Reset to Default
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Recommended: 80x80px PNG or SVG. Max 2MB. 
                    <br/>This logo will replace the default icon in the sidebar and header.
                </p>
                <input 
                    type="file" 
                    ref={logoInputRef} 
                    onChange={handleLogoChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
        </div>
      </div>

      {/* Analysis Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Analysis Configuration</h2>
          <p className="text-sm text-gray-500">Fine-tune the AI sensitivity parameters to control alert frequency.</p>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-900 mb-4">Risk Detection Level</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sensitivityOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => onUpdateSettings({...settings, sensitivity: option.id})}
                className={`relative cursor-pointer rounded-xl border p-5 flex flex-col transition-all duration-200 ${
                  settings.sensitivity === option.id 
                    ? `ring-2 ring-blue-500 border-transparent bg-blue-50/50` 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900">{option.label}</span>
                  {settings.sensitivity === option.id && (
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
                
                <span className={`inline-block self-start text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-3 ${option.color}`}>
                    {option.badge}
                </span>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* Data Management */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Data Management</h2>
          <p className="text-sm text-gray-500">Import/Export datasets or clear local storage.</p>
        </div>
        <div className="p-6 space-y-6">
          
          {/* Export */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Export Analysis Data</h3>
              <p className="text-sm text-gray-500">Download a JSON backup of your current analysis history ({articles.length} items).</p>
            </div>
            <button 
              onClick={handleExport}
              disabled={articles.length === 0}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
          </div>

          {/* Import */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">Import Data</h3>
                    <p className="text-sm text-gray-500">Restore analysis history from a previous export file.</p>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
                <button 
                    id="import-btn"
                    onClick={handleImportClick}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import JSON
                </button>
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-sm font-medium text-red-900">Clear History</h3>
              <p className="text-sm text-red-500">Permanently remove all {articles.length} analyzed articles from the dashboard.</p>
            </div>
            <button 
              onClick={handleClearRequest}
              className="inline-flex justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
               <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;