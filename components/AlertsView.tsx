import React from 'react';
import { AlertEntry } from '../types';

interface AlertsViewProps {
  alerts: AlertEntry[];
}

const AlertsView: React.FC<AlertsViewProps> = ({ alerts }) => {
  
  const handleOpenMail = (alert: AlertEntry) => {
      const subject = encodeURIComponent(alert.subject);
      const body = encodeURIComponent(alert.body);
      window.open(`mailto:${alert.recipient}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
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