
import React, { useState, useEffect, useRef } from 'react';
import { ConfigModal } from './components/ConfigModal';
import { FaceScanner } from './components/FaceScanner';
import { Gallery } from './components/Gallery';
import { Button } from './components/Button';
import { AppConfig, AppState, DriveFile, ScanStats } from './types';
import { CONCURRENCY_LIMIT, ENV_API_KEY, ENV_FOLDER_ID } from './constants';
import { listDriveFiles } from './services/driveService';
import { fetchWebPhotos } from './services/webService';
import { loadModels, detectAllFaces, compareFaces } from './services/faceService';

// Global styles for animation
const styles = `
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [userDescriptor, setUserDescriptor] = useState<Float32Array | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [matches, setMatches] = useState<DriveFile[]>([]);
  
  // Stats for transparency
  const [stats, setStats] = useState<ScanStats>({ 
    total: 0, 
    processed: 0, 
    found: 0, 
    startTime: 0,
    currentFile: '' 
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    if (ENV_API_KEY && ENV_FOLDER_ID) {
      // Auto-config logic if needed
    }

    setAppState(AppState.LOADING_MODELS);
    loadModels()
      .then(() => {
        setIsModelsLoaded(true);
        setAppState(AppState.IDLE);
      })
      .catch((err) => {
        console.error("Failed to load face-api models", err);
        setError("Failed to load AI models. Please refresh the page.");
        setAppState(AppState.ERROR);
      });
  }, []);

  // -- Step 1: Load Photos (Configuration) --
  const handleSaveConfig = async (newConfig: AppConfig, files?: FileList | null) => {
    setAppState(AppState.FETCHING_PHOTOS);
    setConfig(newConfig);
    setMatches([]);
    setAllFiles([]);
    setError(null);

    try {
      let loadedFiles: DriveFile[] = [];

      if (newConfig.sourceType === 'LOCAL' && files) {
        loadedFiles = Array.from(files)
          .filter(f => f.type.startsWith('image/'))
          .map((f, i) => ({
            id: `local-${i}-${f.name}`,
            name: f.name,
            thumbnailLink: '', 
            fileObject: f
          }));
      } else if (newConfig.sourceType === 'DRIVE' && newConfig.folderId && newConfig.apiKey) {
        loadedFiles = await listDriveFiles(newConfig.folderId, newConfig.apiKey);
      } else if (newConfig.sourceType === 'WEB_JSON' && newConfig.jsonUrl) {
        loadedFiles = await fetchWebPhotos(newConfig.jsonUrl);
      }

      if (loadedFiles.length === 0) {
        throw new Error("No photos found in the selected folder.");
      }

      setAllFiles(loadedFiles);
      setAppState(AppState.VIEWING_GALLERY); // Move to Gallery Overview
    } catch (err: any) {
      setError(err.message || "Failed to load photos.");
      setAppState(AppState.IDLE);
      setConfig(null);
    }
  };

  // -- Step 2: Start Scan Process --
  const handleStartScanClick = () => {
    setAppState(AppState.SCANNING_USER);
  };

  // -- Step 3: Face Detected -> Start Processing --
  const handleFaceDetected = (descriptor: Float32Array, imageSrc: string) => {
    setUserDescriptor(descriptor);
    setUserImage(imageSrc);
    setAppState(AppState.PROCESSING);
    
    // Reset stats
    setStats({ 
      total: allFiles.length, 
      processed: 0, 
      found: 0, 
      startTime: Date.now(),
      currentFile: 'Initializing...'
    });
    
    processQueue(allFiles, descriptor);
  };

  // -- Logic: Process Queue --
  const processQueue = async (files: DriveFile[], targetDescriptor: Float32Array) => {
    isCancelledRef.current = false;
    let processedCount = 0;
    
    const chunks = [];
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      chunks.push(files.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      if (isCancelledRef.current) break;

      await Promise.all(chunk.map(async (file) => {
        if (isCancelledRef.current) return;
        
        // Update current file being processed for transparency
        setStats(prev => ({ ...prev, currentFile: file.name }));

        let objectUrl = '';
        try {
          let src = '';
          if (file.fileObject) {
            objectUrl = URL.createObjectURL(file.fileObject);
            src = objectUrl;
          } else {
            src = file.thumbnailLink;
          }

          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = src;

          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const descriptors = await detectAllFaces(img);
          const isMatch = descriptors.some(d => compareFaces(targetDescriptor, d));

          if (isMatch) {
            setMatches(prev => [...prev, file]);
            setStats(prev => ({ ...prev, found: prev.found + 1 }));
          }

        } catch (err) {
           // Skip errors
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          processedCount++;
          setStats(prev => ({ ...prev, processed: processedCount }));
        }
      }));
    }
    
    setAppState(AppState.COMPLETE);
  };

  // -- Calculations: Time Remaining --
  const calculateTimeRemaining = () => {
    if (stats.processed === 0) return "Calculating...";
    const elapsed = Date.now() - stats.startTime;
    const msPerPhoto = elapsed / stats.processed;
    const remaining = stats.total - stats.processed;
    const msRemaining = remaining * msPerPhoto;
    
    if (msRemaining < 60000) {
      return `${Math.ceil(msRemaining / 1000)}s remaining`;
    }
    return `${Math.ceil(msRemaining / 60000)}m remaining`;
  };

  // -- Resets --
  const exitToGallery = () => {
    isCancelledRef.current = true;
    setAppState(AppState.VIEWING_GALLERY);
    setMatches([]);
    setUserDescriptor(null);
  };

  const fullExit = () => {
    isCancelledRef.current = true;
    setConfig(null);
    setAllFiles([]);
    setAppState(AppState.IDLE);
  };

  // -- Renders --

  return (
    <div className="min-h-screen bg-darker text-white font-sans selection:bg-primary selection:text-white flex flex-col">
      
      {/* 1. CONFIG SCREEN */}
      {(!config || appState === AppState.IDLE) && (
        <ConfigModal onSave={handleSaveConfig} initialConfig={config} />
      )}

      {/* 2. MAIN APP CONTAINER (If Configured) */}
      {config && appState !== AppState.IDLE && (
        <>
           {/* HEADER */}
          <header className="border-b border-gray-800 bg-darker/80 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={fullExit}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">EventMatch</h1>
                  {allFiles.length > 0 && (
                    <p className="text-xs text-gray-500">{allFiles.length} Photos Loaded</p>
                  )}
                </div>
              </div>
              
              {appState === AppState.VIEWING_GALLERY && (
                 <Button onClick={handleStartScanClick} className="shadow-primary/25">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   Find My Photos
                 </Button>
              )}
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col">
            
            {/* VIEW: FETCHING */}
            {appState === AppState.FETCHING_PHOTOS && (
               <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <h2 className="text-2xl font-bold">Loading Gallery...</h2>
                  <p className="text-gray-400">Reading photos from source.</p>
               </div>
            )}

            {/* VIEW: GALLERY OVERVIEW (Transparency Step 1) */}
            {appState === AppState.VIEWING_GALLERY && (
              <div className="animate-fade-in-up">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Gallery Overview</h2>
                    <p className="text-gray-400">
                      We loaded <strong>{allFiles.length} photos</strong>. <br/>
                      Click "Find My Photos" to scan your face and filter this list.
                    </p>
                  </div>
                </div>

                {/* Grid of ALL photos to prove they are loaded */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 opacity-50 hover:opacity-100 transition-opacity">
                   {allFiles.slice(0, 48).map((file) => (
                     <div key={file.id} className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative">
                        <img 
                          src={file.fileObject ? URL.createObjectURL(file.fileObject) : file.thumbnailLink} 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                        />
                     </div>
                   ))}
                   {allFiles.length > 48 && (
                     <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">
                       +{allFiles.length - 48} more
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* VIEW: SCANNING USER (Transparency Step 2) */}
            {appState === AppState.SCANNING_USER && (
               <div className="flex-1 flex items-center justify-center">
                 <FaceScanner 
                   onFaceDetected={handleFaceDetected} 
                   isModelsLoaded={isModelsLoaded}
                   onCancel={exitToGallery}
                 />
               </div>
            )}

            {/* VIEW: PROCESSING (Transparency Step 3) */}
            {(appState === AppState.PROCESSING || appState === AppState.COMPLETE) && (
              <div className="flex-1 flex flex-col h-full">
                {appState === AppState.PROCESSING && (
                  <div className="mb-8 w-full max-w-2xl mx-auto">
                    <div className="bg-card border border-gray-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                       {/* Background Pulse */}
                       <div className="absolute inset-0 bg-primary/5 animate-pulse-slow"></div>
                       
                       <div className="relative z-10">
                         <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-4">
                              {userImage && <img src={userImage} className="w-12 h-12 rounded-full border-2 border-primary object-cover" />}
                              <div>
                                <h3 className="font-bold text-lg">Scanning Gallery...</h3>
                                <p className="text-sm text-gray-400 font-mono">{calculateTimeRemaining()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                             <div className="text-2xl font-bold text-primary">{Math.round((stats.processed / stats.total) * 100)}%</div>
                             <div className="text-xs text-gray-500">{stats.processed} / {stats.total}</div>
                           </div>
                         </div>

                         {/* Progress Bar */}
                         <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
                           <div 
                              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
                              style={{ width: `${(stats.processed / stats.total) * 100}%` }}
                           ></div>
                         </div>

                         {/* Live File Monitor */}
                         <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-2 rounded-lg font-mono truncate">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Processing: <span className="text-gray-300">{stats.currentFile}</span>
                         </div>
                       </div>
                    </div>
                  </div>
                )}
                
                {/* Results Gallery */}
                <div className="flex-1">
                   <Gallery photos={matches} onReset={exitToGallery} userImage={userImage || ''} />
                </div>
              </div>
            )}
          </main>
          
          <footer className="text-center py-4 text-xs text-gray-600 border-t border-gray-900 bg-black/20">
             Made by Aryan Gupta
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
