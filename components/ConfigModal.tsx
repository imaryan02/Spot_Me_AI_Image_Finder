
import React, { useState } from 'react';
import { AppConfig, SourceType } from '../types';
import { Button } from './Button';
import { ENV_API_KEY, ENV_FOLDER_ID } from '../constants';

interface ConfigModalProps {
  onSave: (config: AppConfig, localFiles?: FileList | null) => void;
  initialConfig?: AppConfig | null;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ onSave, initialConfig }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceType>('DRIVE');
  
  // Drive State
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || ENV_API_KEY);
  const [folderInput, setFolderInput] = useState(initialConfig?.folderId || ENV_FOLDER_ID);
  const [jsonUrl, setJsonUrl] = useState(initialConfig?.jsonUrl || '');
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const [loadingFileCount, setLoadingFileCount] = useState(0);

  const handleLocalFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingLocal(true);
      setLoadingFileCount(e.target.files.length);
      
      // Small delay to allow UI to update before heavy file processing
      setTimeout(() => {
        onSave({ sourceType: 'LOCAL', isLocalSession: true }, e.target.files);
      }, 500);
    }
  };

  const extractFolderId = (input: string): string | null => {
    if (!input) return null;
    const urlMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
    return null;
  };

  const handleCloudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const folderId = extractFolderId(folderInput);
    if (activeTab === 'DRIVE' && folderId && apiKey) {
      onSave({ sourceType: 'DRIVE', apiKey, folderId });
    } else if (activeTab === 'WEB_JSON' && jsonUrl) {
      onSave({ sourceType: 'WEB_JSON', jsonUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darker/95 p-4 animate-fade-in">
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-card rounded-3xl border border-gray-800 shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* Left Side: Hero / Local Kiosk */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center items-center text-center bg-gradient-to-br from-gray-900 to-black relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          
          <div className="z-10 space-y-8 w-full max-w-md">
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
                Event<span className="text-primary">Match</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                The secure, offline way to find your photos.<br/>
                <span className="text-primary font-semibold">1. Select Folder</span> → <span className="text-primary font-semibold">2. Scan Face</span> → <span className="text-primary font-semibold">3. Get Photos</span>
              </p>
            </div>

            <div className="relative group">
               <button className={`w-full bg-primary hover:bg-primary/90 text-white text-xl font-bold py-8 px-8 rounded-3xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center gap-3 border border-primary/20 ${isProcessingLocal ? 'opacity-80 cursor-wait' : ''}`}>
                 {isProcessingLocal ? (
                    <>
                      <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-lg">Reading {loadingFileCount > 0 ? loadingFileCount : ''} files...</span>
                    </>
                 ) : (
                    <>
                      <svg className="w-12 h-12 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-2xl">Select Photo Folder</span>
                      <span className="text-sm font-normal text-white/70">Supports JPG, PNG</span>
                    </>
                 )}
               </button>
               <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleLocalFolderSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessingLocal}
               />
            </div>
            
            <p className="text-sm text-gray-500">
              Photos stay on your device. No internet required for local files.
            </p>
          </div>
          
          <div className="absolute bottom-6 text-xs text-gray-600 font-medium">
             Made by Aryan Gupta
          </div>
        </div>

        {/* Right Side: Legacy / Cloud Options */}
        <div className={`md:w-80 bg-darker border-l border-gray-800 p-8 flex flex-col justify-end transition-all duration-300 ${showAdvanced ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors mb-6"
            >
              <span>{showAdvanced ? 'Hide Cloud Options' : 'Show Cloud Options'}</span>
              <svg className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <form onSubmit={handleCloudSubmit} className="space-y-6 animate-fade-in mb-auto">
                <div className="flex rounded-lg bg-black/40 p-1 mb-6">
                  {(['DRIVE', 'WEB_JSON'] as SourceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveTab(type)}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                        activeTab === type ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {type === 'DRIVE' ? 'Drive' : 'Web URL'}
                    </button>
                  ))}
                </div>

                {activeTab === 'DRIVE' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Folder Link</label>
                      <input
                        type="text"
                        value={folderInput}
                        onChange={(e) => setFolderInput(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        placeholder="https://drive.google.com..."
                      />
                    </div>
                    {!ENV_API_KEY && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">API Key</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'WEB_JSON' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">JSON List URL</label>
                    <input
                      type="url"
                      value={jsonUrl}
                      onChange={(e) => setJsonUrl(e.target.value)}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                      placeholder="https://site.com/photos.json"
                    />
                  </div>
                )}

                <Button type="submit" variant="secondary" className="w-full mt-4">
                  Load Cloud Gallery
                </Button>
              </form>
            )}
          
          <div className="text-xs text-gray-700 text-center mt-4">
             v3.2 Transparent Kiosk
          </div>
        </div>
      </div>
    </div>
  );
};
