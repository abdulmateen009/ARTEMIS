import React, { useState } from 'react';
import { AlertEntry } from '../types';

interface AlertsViewProps {
  alerts: AlertEntry[];
}

interface EmailConfig {
  id: string;
  role: string;
  email: string;
  isActive: boolean;
}

const AlertsView: React.FC<AlertsViewProps> = ({ alerts }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([
    { id: '1', role: 'Chief Security Officer', email: 'cso@artemis.corp', isActive: true },
    { id: '2', role: 'Legal Compliance', email: 'legal.audit@artemis.corp', isActive: true },
    { id: '3', role: 'Public Relations Lead', email: 'press.office@artemis.corp', isActive: false },
    { id: '4', role: 'Regional Crisis Team', email: 'apac.crisis@artemis.corp', isActive: false },
    { id: '5', role: 'System Administrator', email: 'sysadmin@artemis.corp', isActive: true },
  ]);

  const handleToggleEmail = (id: string) => {
    if (!isAdmin) return; // Prevent toggling if not admin
    
    setEmailConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, isActive: !config.isActive } : config
    ));
  };

  const handleEmailChange = (id: string, newEmail: string) => {
    setEmailConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, email: newEmail } : config
    ));
  };

  const handleOpenMail = (alert: AlertEntry) => {
      const subject = encodeURIComponent(alert.subject);
      const body = encodeURIComponent(alert.body);
      window.open(`mailto:${alert.recipient}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-8">
       
       {/* 1. Email Configuration Section */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <h2 className="text-lg font-semibold text-gray-800">Alert Distribution List</h2>
                <p className="text-sm text-gray-500">Manage recipients for high-priority security notifications.</p>
             </div>
             
             {/* Admin Toggle */}
             <label className="flex items-center cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <div className="mr-3 text-gray-700 font-medium text-xs uppercase tracking-wider">
                  {isAdmin ? 'Admin Access: UNLOCKED' : 'Admin Access: LOCKED'}
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isAdmin} 
                    onChange={() => setIsAdmin(!isAdmin)} 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isAdmin ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAdmin ? 'transform translate-x-4' : ''}`}></div>
                </div>
             </label>
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
                          {isAdmin ? (
                            <input 
                                type="email"
                                value={config.email}
                                onChange={(e) => handleEmailChange(config.id, e.target.value)}
                                className="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1 px-2 border"
                                placeholder="Enter email address"
                            />
                          ) : (
                            <p className={`text-xs ${config.isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                {config.email}
                            </p>
                          )}
                      </div>
                   </div>

                   {/* Right Aligned Buttons */}
                   <div className="flex items-center ml-4">
                      <button
                         onClick={() => handleToggleEmail(config.id)}
                         disabled={!isAdmin}
                         className={`
                            px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all shadow-sm
                            ${config.isActive 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }
                            ${!isAdmin && 'opacity-60 cursor-not-allowed'}
                         `}
                      >
                         {config.isActive ? 'Active' : 'Not Active'}
                      </button>
                   </div>
                </div>
             ))}
          </div>
          
          {!isAdmin && (
              <div className="bg-gray-50 p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                  <span className="flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Enable Admin Access to modify distribution settings
                  </span>
              </div>
          )}
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
                                          onClick={() => handleOpenMail(alert)}
                                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1"
                                       >
                                           View Email Body
                                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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