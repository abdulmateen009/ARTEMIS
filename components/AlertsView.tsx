import React, { useState } from 'react';
import { AlertEntry } from '../types';

interface AlertsViewProps {
  alerts: AlertEntry[];
  onDeleteAlert: (id: string) => void;
}

interface EmailConfig {
  id: string;
  role: string;
  email: string;
  isActive: boolean;
}

const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onDeleteAlert }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertEntry | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([
    { id: '1', role: 'Chief Security Officer', email: 'cso@artemis.corp', isActive: true },
    { id: '2', role: 'Legal Compliance', email: 'legal.audit@artemis.corp', isActive: true },
    { id: '3', role: 'Public Relations Lead', email: 'press.office@artemis.corp', isActive: false },
    { id: '4', role: 'Regional Crisis Team', email: 'apac.crisis@artemis.corp', isActive: false },
    { id: '5', role: 'System Administrator', email: 'sysadmin@artemis.corp', isActive: true },
  ]);

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

  const handleToggleEmail = (id: string) => {
    setEmailConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, isActive: !config.isActive } : config
    ));
  };

  const handleEmailChange = (id: string, newEmail: string) => {
    setEmailConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, email: newEmail } : config
    ));
  };

  const handleViewDetails = (alert: AlertEntry) => {
      setSelectedAlert(alert);
  };

  const handleCloseModal = () => {
      setSelectedAlert(null);
  };

  const confirmDeleteAlert = () => {
      if (deleteConfirmation) {
          onDeleteAlert(deleteConfirmation);
          setDeleteConfirmation(null);
      }
  };

  return (
    <div className="space-y-8 relative">
       
       {/* Delete Confirmation Modal */}
       {deleteConfirmation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmation(null)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Alert Log?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove this alert from the system history.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={confirmDeleteAlert}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-bold text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Delete Log
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
       )}

       {/* Alert Details Modal */}
       {selectedAlert && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
                  <h3 className="text-lg font-bold text-white">Security Alert Details</h3>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                         <span className="text-xs text-gray-500 uppercase font-bold">Risk Level</span>
                         <p className="font-bold text-red-700">{selectedAlert.riskLevel}</p>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                         <span className="text-xs text-gray-500 uppercase font-bold">Source</span>
                         <p className="font-bold text-gray-900">{selectedAlert.source}</p>
                     </div>
                 </div>
                 
                 <div>
                     <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Subject Line</span>
                     <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800">
                         {selectedAlert.subject}
                     </div>
                 </div>

                 <div>
                     <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Email Body Content</span>
                     <div className="p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm h-64 overflow-y-auto">
                         {selectedAlert.body}
                     </div>
                 </div>

                 <div className="pt-2 text-xs text-gray-400 flex justify-between">
                     <span>Recipient: {selectedAlert.recipient}</span>
                     <span>Timestamp: {new Date(selectedAlert.timestamp).toLocaleString()}</span>
                 </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button 
                    onClick={handleCloseModal} 
                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Close
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

       {/* 1. Email Configuration Section */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <h2 className="text-lg font-semibold text-gray-800">Alert Distribution List</h2>
                <p className="text-sm text-gray-500">Manage recipients for high-priority security notifications.</p>
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

          <div className="divide-y divide-gray-100">
             {emailConfigs.map((config) => (
                <div key={config.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                   <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                          config.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                          {config.role.charAt(0)}
                      </div>
                      <div className="flex-1 max-w-md">
                          <h4 className={`text-sm font-bold ${config.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                              {config.role}
                          </h4>
                          <input 
                              type="email"
                              value={config.email}
                              onChange={(e) => handleEmailChange(config.id, e.target.value)}
                              className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1 px-2 border text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-colors"
                              placeholder="Enter email address"
                          />
                      </div>
                   </div>

                   {/* Right Aligned Buttons */}
                   <div className="flex items-center ml-4">
                      <button
                         onClick={() => handleToggleEmail(config.id)}
                         className={`
                            px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all shadow-sm
                            ${config.isActive 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }
                         `}
                      >
                         {config.isActive ? 'Active' : 'Not Active'}
                      </button>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* 2. Existing Log Section */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Automated Notification Logs</h2>
                    <p className="text-sm text-gray-500">History of security alerts sent to administrators.</p>
                </div>
                <div className="text-right">
                     <span className="text-2xl font-bold text-gray-800">{alerts.length}</span>
                     <p className="text-xs text-gray-400 uppercase">Total Alerts</p>
                </div>
           </div>
           
           {alerts.length === 0 ? (
                <div className="text-center py-12 border-t border-gray-100">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                         <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No automated alerts have been triggered yet.</p>
                    <p className="text-xs text-gray-400">Run a scan in "Data Sources" to test the system.</p>
                </div>
           ) : (
               <div className="overflow-hidden rounded-lg border border-gray-200">
                   <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                           <tr>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk / Source</th>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated Content</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                           {alerts.map((alert) => (
                               <tr key={alert.id} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                       {new Date(alert.timestamp).toLocaleTimeString()} <br/>
                                       {new Date(alert.timestamp).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-3 text-sm text-gray-800">
                                       {alert.recipient}
                                   </td>
                                   <td className="px-4 py-3">
                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 mb-1">
                                           {alert.riskLevel}
                                       </span>
                                       <div className="text-xs text-gray-500">{alert.source}</div>
                                   </td>
                                   <td className="px-4 py-3">
                                       <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{alert.subject}</p>
                                       <button 
                                          onClick={() => handleViewDetails(alert)}
                                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1 font-semibold"
                                       >
                                           View Full Email
                                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                           </svg>
                                       </button>
                                   </td>
                                   <td className="px-4 py-3 text-right whitespace-nowrap">
                                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                           <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                           </svg>
                                           {alert.status}
                                       </span>
                                   </td>
                                   <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmation(alert.id);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 transition-all"
                                        >
                                            Delete
                                        </button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           )}
       </div>
    </div>
  );
};

export default AlertsView;