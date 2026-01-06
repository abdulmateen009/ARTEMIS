import React, { useState, useEffect } from 'react';

// --- Types & Interfaces ---
interface FileItem {
  id: string;
  name: string;
  size: string;
}

interface FileManagerProps {
  currentUserRole: 'admin' | 'user'; 
}

const api = {
  deleteFile: async (fileId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`Backend: Deleting file ID ${fileId}...`);
      setTimeout(() => {
        if (Math.random() < 0.1) {
            reject(new Error("Network timeout"));
        } else {
            resolve();
        }
      }, 800); 
    });
  },
  getFiles: async (): Promise<FileItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '101', name: 'quarterly_report.pdf', size: '2.4 MB' },
          { id: '102', name: 'project_logo.png', size: '500 KB' },
          { id: '103', name: 'employee_data.csv', size: '1.2 MB' },
          { id: '104', name: 'security_audit_2024.docx', size: '8.1 MB' },
          { id: '105', name: 'incident_log_backup.json', size: '45 KB' },
        ]);
      }, 500);
    });
  }
};

const FileManager: React.FC<FileManagerProps> = ({ currentUserRole }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const data = await api.getFiles();
        setFiles(data);
      } catch (error) {
        console.error("Failed to fetch files", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const promptDelete = (file: FileItem) => {
    setDeleteTarget(file);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const fileId = deleteTarget.id;
    setIsDeleting(prev => ({ ...prev, [fileId]: true }));

    try {
      await api.deleteFile(fileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    } finally {
      setIsDeleting(prev => ({ ...prev, [fileId]: false }));
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <svg className="animate-spin h-8 w-8 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="text-sm font-medium">Loading files...</span>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl mx-auto relative">
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !isDeleting[deleteTarget.id] && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete File?</h3>
              <p className="text-sm text-gray-500 mt-2">Are you sure you want to delete <span className="font-bold text-gray-800">"{deleteTarget.name}"</span>?</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" disabled={isDeleting[deleteTarget.id]} onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={isDeleting[deleteTarget.id]} onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-70">{isDeleting[deleteTarget.id] ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-gray-800">File Manager</h2>
            <p className="text-sm text-gray-500">System file repository</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-bold">Role:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${currentUserRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                {currentUserRole}
            </span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No files available.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {files.map((file) => {
            const isFileDeleting = isDeleting[file.id];
            return (
              <li key={file.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                      <div className="font-medium text-gray-900 text-sm">{file.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{file.size}</div>
                  </div>
                </div>
                {currentUserRole === 'admin' && (
                  <button type="button" onClick={() => promptDelete(file)} disabled={isFileDeleting} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isFileDeleting ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'}`}>Delete</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileManager;