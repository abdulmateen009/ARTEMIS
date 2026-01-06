import React, { useState, useEffect } from 'react';

// --- Types & Interfaces ---
interface FileItem {
  id: string;
  name: string;
  size: string;
}

interface FileManagerProps {
  // The role is passed in, typically from an AuthContext or parent component
  currentUserRole: 'admin' | 'user'; 
}

// --- REAL Backend API Integration ---
// IMPORTANT: This uses fetch, you can replace it with axios if you use that library.

const api = {
  // 1. REAL DELETE FILE IMPLEMENTATION
  deleteFile: async (fileId: string): Promise<void> => {
    // ⚠️ REPLACE 'YOUR_BACKEND_API_URL' with your server's base URL!
    const backendUrl = `YOUR_BACKEND_API_URL/files/${fileId}`; 

    // --- You need the User Token here! ---
    // Assuming you have a function/variable to get the current user's JWT
    const userToken = localStorage.getItem('authToken'); // Example: get from storage/context

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // 🔑 Authentication is critical for admin-only deletion
        'Authorization': `Bearer ${userToken}`, 
      },
    });

    if (!response.ok) {
      // Throw an error that the handleDeleteFile's try...catch block will capture
      const errorText = await response.text();
      throw new Error(`Deletion Failed! Status: ${response.status}. Detail: ${errorText.substring(0, 100)}`);
    }

    console.log(`[API] Successfully deleted file ID ${fileId} on the server.`);
  },

  // 2. REAL GET FILES IMPLEMENTATION
  getFiles: async (): Promise<FileItem[]> => {
    // ⚠️ REPLACE 'YOUR_BACKEND_API_URL' with your server's base URL!
    const backendUrl = 'YOUR_BACKEND_API_URL/files';
    const userToken = localStorage.getItem('authToken'); 

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`, 
      },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch files. Status: ${response.status}`);
    }
    
    return await response.json();
  }
};
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

// --- FileManager Component ---
const FileManager: React.FC<FileManagerProps> = ({ currentUserRole }) => {
  // Requirement 1: State Management
  const [files, setFiles] = useState<FileItem[]>([]);
  // Changed to Record to track loading state per file independently
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Fetch files on component mount
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

  // Requirement 2: Deletion Function
  const handleDeleteFile = async (fileId: string) => {
    // Simple confirmation before action
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    // Requirement 6: Loading state set to true for specific file
    setIsDeleting(prev => ({ ...prev, [fileId]: true }));

    try {
      // Requirement 3: API Integration
      await api.deleteFile(fileId);

      // Requirement 4: Success Logic (Update state immediately)
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      
      // Requirement 4: Success Logic (Display feedback)
      // Note: In a real app, toast notifications are preferred over alert()
      // alert("File successfully deleted."); 

    } catch (error) {
      // Requirement 5: Error Handling
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    } finally {
      // Requirement 6: Loading state reset
      setIsDeleting(prev => ({ ...prev, [fileId]: false }));
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <svg className="animate-spin h-8 w-8 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Loading files...</span>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-gray-800">File Manager</h2>
            <p className="text-sm text-gray-500">System file repository</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-bold">Current Role:</span>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    // Disable interaction if this specific file is deleting
                    disabled={isFileDeleting}
                    title="Delete this file"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isFileDeleting 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' 
                          : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                    }`}
                  >
                    {isFileDeleting ? 'Deleting...' : 'Delete'}
                  </button>
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