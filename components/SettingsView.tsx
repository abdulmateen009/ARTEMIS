import React, { useRef } from 'react';
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

  const handleClear = () => {
    if (articles.length === 0) {
        notify('No data to clear.', 'info');
        return;
    }
    
    if (window.confirm('⚠️ WARNING: Are you sure you want to clear all analysis history?\n\nThis action cannot be undone and will permanently delete all local data.')) {
        onClearData();
        notify('All analysis history has been permanently deleted.', 'success');
    }
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
    <div className="max-w-4xl space-y-8">
      {/* Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Notification Preferences</h2>
          <p className="text-sm text-gray-500">Manage how and when you receive alerts.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Alerts</label>
              <p className="text-sm text-gray-500">Receive instant automated notifications for high-risk articles found during scans.</p>
            </div>
            <button 
              onClick={() => onUpdateSettings({...settings, emailEnabled: !settings.emailEnabled})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
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
              disabled={!settings.emailEnabled}
              className="w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-50 disabled:text-gray-400"
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
              onClick={handleClear}
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