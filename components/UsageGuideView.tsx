import React, { useState, useRef } from 'react';
import { DocumentationFile } from '../types';

interface UsageGuideViewProps {
  docs: DocumentationFile[];
  onUploadDoc: (doc: DocumentationFile) => void;
  onDeleteDoc: (id: string) => void;
}

// Mock API service (Simulating backend behavior as requested)
const api = {
  deleteFile: async (fileId: string): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`[API] Deletion request sent for file ID: ${fileId}`);
    return; // Success
  }
};

const UsageGuideView: React.FC<UsageGuideViewProps> = ({ docs, onUploadDoc, onDeleteDoc }) => {
  // Authorization State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Deletion State
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  // MODAL STATE: Track which file is being deleted instead of using window.confirm
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload PDF files only.');
        return;
      }

      setIsUploading(true);
      
      // Convert to Base64 to persist in localStorage (Data URL)
      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
              const newDoc: DocumentationFile = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                uploadDate: new Date().toISOString().split('T')[0],
                url: result // Persistent Data URL
              };
              onUploadDoc(newDoc);
          }
          setIsUploading(false);
      };
      
      reader.onerror = () => {
          alert("Failed to read file.");
          setIsUploading(false);
      };

      reader.readAsDataURL(file);
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  // 1. Request Deletion (Opens Modal)
  const requestDelete = (fileId: string, fileName: string) => {
      setDeleteTarget({ id: fileId, name: fileName });
  };

  // 2. Confirm Deletion (Actual Action)
  const confirmDelete = async () => {
      if (!deleteTarget) return;
      const { id, name } = deleteTarget;
      
      setIsDeleting(prev => ({ ...prev, [id]: true }));

      try {
        await api.deleteFile(id);
        onDeleteDoc(id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error deleting file ${id}:`, error);
        alert(`❌ Deletion Failed for "${name}": ${errorMessage}`);
      } finally {
        setIsDeleting(prev => ({ ...prev, [id]: false }));
        setDeleteTarget(null); // Close modal
      }
  };

  // Fix for opening Data URLs in new tabs
  const handleViewDocument = (e: React.MouseEvent, doc: DocumentationFile) => {
    e.preventDefault();
    try {
        if (doc.url.startsWith('data:')) {
            const base64Data = doc.url.split(',')[1];
            if (!base64Data) {
                alert("File data is corrupt.");
                return;
            }

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } else {
            window.open(doc.url, '_blank');
        }
    } catch (error) {
        console.error("Error opening document:", error);
        alert("Failed to open document. Please try re-uploading.");
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isDeleting[deleteTarget.id] && setDeleteTarget(null)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete File?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete <span className="font-bold text-gray-700">"{deleteTarget.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                disabled={isDeleting[deleteTarget.id]}
                onClick={confirmDelete}
                className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-bold text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    isDeleting[deleteTarget.id] ? 'bg-red-400 cursor-wait' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDeleting[deleteTarget.id] ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                type="button"
                disabled={isDeleting[deleteTarget.id]}
                onClick={() => setDeleteTarget(null)}
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

      {/* Admin Toggle Switch */}
      <div className="flex justify-end mb-2">
         <div 
           onClick={handleAdminToggle}
           className="flex items-center cursor-pointer select-none group"
         >
            <div className="relative">
              <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ${isAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 flex items-center justify-center ${isAdmin ? 'transform translate-x-4' : ''}`}>
                 {isAdmin ? (
                    <svg className="w-2.5 h-2.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 ) : (
                    <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 )}
              </div>
            </div>
            <div className={`ml-3 font-bold text-xs uppercase tracking-wider transition-colors ${isAdmin ? 'text-blue-700' : 'text-gray-500'}`}>
              {isAdmin ? 'Admin Mode (Authorized)' : 'Public View (Read Only)'}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Project Documentation</h2>
            <p className="text-sm text-gray-500">Official usage guidelines, standard operating procedures, and risk assessment protocols.</p>
          </div>
          
          {/* CRITICAL: UPLOAD IS ADMIN ONLY */}
          {isAdmin && (
            <div className="flex items-center gap-3 animate-fade-in-down">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="application/pdf" 
                  className="hidden" 
                />
                <button 
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isUploading ? (
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                  )}
                  {isUploading ? 'Uploading...' : 'Upload PDF'}
                </button>
            </div>
          )}
        </div>

        {/* Restrict Information Banner to Admins Only */}
        {isAdmin && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 animate-fade-in-down">
                 <div className="flex items-start">
                     <div className="flex-shrink-0">
                         <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                         </svg>
                     </div>
                     <div className="ml-3">
                         <h3 className="text-sm font-medium text-blue-800">Admin Access Granted</h3>
                         <div className="mt-2 text-sm text-blue-700">
                             <p>
                                 You have authorization to upload standard operating procedures. Public users do not see this section.
                             </p>
                         </div>
                     </div>
                 </div>
            </div>
        )}

        <div className="overflow-hidden border border-gray-200 rounded-lg">
           <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                   <tr>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                       <th scope="col" className="relative px-6 py-3">
                           <span className="sr-only">Actions</span>
                       </th>
                   </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                   {docs.map((doc) => (
                       <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                               <button 
                                  onClick={(e) => handleViewDocument(e, doc)}
                                  className="flex items-center group cursor-pointer text-gray-900 hover:text-blue-600 text-left w-full"
                               >
                                   <div className="flex-shrink-0 h-10 w-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                       <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                       </svg>
                                   </div>
                                   <div className="ml-4">
                                       <div className="text-sm font-medium">{doc.name}</div>
                                       <div className="text-xs text-gray-500 group-hover:text-blue-500">Document File</div>
                                   </div>
                               </button>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {doc.size}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {doc.uploadDate}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                               {/* VIEW IS ALWAYS VISIBLE */}
                               <a 
                                   href="#"
                                   onClick={(e) => handleViewDocument(e, doc)}
                                   className={`text-blue-600 hover:text-blue-900 font-medium inline-block ${isAdmin ? 'mr-4' : ''}`}
                                >
                                   View
                               </a>
                               
                               {/* CRITICAL: DELETE IS ADMIN ONLY */}
                               {isAdmin && (
                                   <button 
                                       type="button"
                                       onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            requestDelete(doc.id, doc.name);
                                       }}
                                       disabled={isDeleting[doc.id]}
                                       className={`text-red-600 hover:text-red-900 font-bold transition-opacity ${isDeleting[doc.id] ? 'opacity-50 cursor-wait' : ''}`}
                                   >
                                       Delete
                                   </button>
                               )}
                           </td>
                       </tr>
                   ))}
                   {docs.length === 0 && (
                       <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                               {isAdmin ? (
                                   <div className="flex flex-col items-center">
                                       <p className="font-semibold text-gray-700 mb-1">No documentation files uploaded.</p>
                                       <p className="text-gray-400 text-xs">Click 'Upload PDF' to add SOPs or Guidelines.</p>
                                   </div>
                               ) : (
                                   <div className="flex flex-col items-center">
                                       <p className="font-medium text-gray-600 mb-1">No documents available.</p>
                                       <p className="text-gray-400 text-xs">Switch to <span className="font-bold text-gray-500">Admin Mode</span> to manage project files.</p>
                                   </div>
                               )}
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

export default UsageGuideView;