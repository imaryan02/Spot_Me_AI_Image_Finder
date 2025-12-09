import React, { useState } from 'react';
import { AppConfig } from '../types';

interface ConfigModalProps {
  onSave: (config: AppConfig, localFiles?: FileList | null) => void;
  initialConfig?: AppConfig | null;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ onSave }) => {
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-[#050505] to-slate-900 animate-fade-in relative overflow-x-hidden flex flex-col font-sans">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px]" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[20%] w-[10vw] h-[10vw] bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SpotMe</span>
          </div>

          <a
            href="https://www.linkedin.com/in/imaryan02/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all font-medium text-sm text-gray-400 hover:text-white"
          >
            <span>Made by</span>
            <span className="text-primary font-bold group-hover:text-purple-400 transition-colors">Aryan</span>
            <svg className="w-3 h-3 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-32 pb-12 px-6">

        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
              Next Gen Gallery
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Finding you in <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-pulse-slow">
              1000s of photos...
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop scrolling manually. Our AI instantly filters entire event albums to find only <strong>you</strong>.
            Secure, private, and works completely offline.
          </p>
        </div>

        {/* CTA SECTION */}
        <div className="w-full max-w-lg relative group mb-24 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>

          <button className={`relative w-full bg-[#111] hover:bg-[#151515] border border-white/10 text-white p-8 rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-4 ${isProcessingLocal ? 'cursor-wait opacity-80' : ''}`}>
            {isProcessingLocal ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <span className="text-xl font-bold">Analysing Library...</span>
                <span className="text-gray-500 text-sm mt-1">{loadingFileCount} files found</span>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/10 flex items-center justify-center mb-2 ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold block mb-1">Select Photo Folder</span>
                  <span className="text-gray-400 text-sm">Select the folder with all event photos</span>
                </div>
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

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">100% Private</h3>
            <p className="text-sm text-gray-400">Photos never leave your device. All processing happens locally in your browser.</p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Blazing Fast</h3>
            <p className="text-sm text-gray-400">Powered by WebAssembly AI to scan thousands of photos in seconds.</p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Original Quality</h3>
            <p className="text-sm text-gray-400">Get your original, high-resolution photos directly from the source.</p>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-8 text-center text-xs text-gray-600 border-t border-white/5">
        <p>© 2025 SpotMe • <a href="https://www.linkedin.com/in/imaryan02/" className="hover:text-primary transition-colors">Aryan Gupta</a></p>
      </footer>

    </div>
  );
};
