import React, { useState, useRef } from 'react';
import { DocumentationFile } from '../types';

const UsageGuideView: React.FC = () => {
  // Mock initial data - simplified for client-side demo
  const [docs, setDocs] = useState<DocumentationFile[]>([
    {
      id: '1',
      name: 'ARTEMIS_User_Manual_v1.0.pdf',
      size: '1.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      url: '#' 
    },
    {
        id: '2',
        name: 'Risk_Assessment_Guidelines.pdf',
        size: '0.8 MB',
        uploadDate: new Date().toISOString().split('T')[0],
        url: '#'
    }
  ]);
  
  // State to simulate Authorization logic
  const [isAdmin, setIsAdmin] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      const newDoc: DocumentationFile = {
        id: Date.now().toString(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(file)
      };
      
      setDocs(prev => [newDoc, ...prev]);
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  const handleDelete = (id: string) => {
      // Use window.confirm explicitly and functional state update for reliability
      if (window.confirm('Are you sure you want to delete this document?')) {
        setDocs(prevDocs => prevDocs.filter(d => d.id !== id));
      }
  };

  const handleLinkClick = (e: React.MouseEvent, doc: DocumentationFile) => {
      if (doc.url === '#') {
          e.preventDefault();
          alert("This is a placeholder file. Upload a real PDF to test the viewer.");
      }
  };

  return (
    <div className="space-y-6">
      {/* Authorization Simulation Toggle */}
      <div className="flex justify-end mb-2">
         <label className="flex items-center cursor-pointer select-none">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isAdmin} 
                onChange={() => setIsAdmin(!isAdmin)} 
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${isAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAdmin ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-600 font-medium text-xs uppercase tracking-wider">
              {isAdmin ? 'Admin Mode (Authorized)' : 'Public View (Read Only)'}
            </div>
         </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Project Documentation</h2>
            <p className="text-sm text-gray-500">Official usage guidelines, standard operating procedures, and risk assessment protocols.</p>
          </div>
          
          {/* Restrict Upload Button to Admins Only */}
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
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Upload PDF
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
                               <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => handleLinkClick(e, doc)}
                                  className="flex items-center group cursor-pointer text-gray-900 hover:text-blue-600 block"
                               >
                                   <div className="flex-shrink-0 h-10 w-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                       <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                       </svg>
                                   </div>
                                   <div className="ml-4">
                                       <div className="text-sm font-medium">{doc.name}</div>
                                       <div className="text-xs text-gray-500 group-hover:text-blue-500">PDF Document</div>
                                   </div>
                               </a>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {doc.size}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {doc.uploadDate}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                               <a 
                                   href={doc.url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   onClick={(e) => handleLinkClick(e, doc)}
                                   className={`text-blue-600 hover:text-blue-900 font-medium inline-block ${isAdmin ? 'mr-4' : ''}`}
                                >
                                   View
                               </a>
                               
                               {/* Restrict Delete Button to Admins Only */}
                               {isAdmin && (
                                   <button 
                                       type="button"
                                       onClick={() => handleDelete(doc.id)}
                                       className="text-red-600 hover:text-red-900"
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
                               No documentation files found. {isAdmin ? 'Upload a PDF to get started.' : 'Please contact admin for access.'}
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