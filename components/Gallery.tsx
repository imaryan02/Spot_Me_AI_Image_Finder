
import React, { useState } from 'react';
import { DriveFile } from '../types';

interface GalleryProps {
  photos: DriveFile[];
  onReset: () => void;
  userImage: string;
}

export const Gallery: React.FC<GalleryProps> = ({ photos, onReset, userImage }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Helper to handle Drag & Drop "out" of the browser
  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, photo: DriveFile) => {
    // This allows dragging the file directly to Desktop or File Explorer in Chrome/Edge
    // Format: "content-type:filename:url"
    if (photo.fileObject) {
       const url = URL.createObjectURL(photo.fileObject);
       const downloadUrl = `${photo.fileObject.type}:${photo.name}:${url}`;
       e.dataTransfer.setData("DownloadURL", downloadUrl);
       // Standard fallback
       e.dataTransfer.setData("text/plain", url);
    } else {
       // For remote URLs
       const url = photo.webContentLink || photo.thumbnailLink;
       e.dataTransfer.setData("text/plain", url);
       e.dataTransfer.setData("text/uri-list", url);
    }
    e.dataTransfer.effectAllowed = "copy";
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const downloadSelected = () => {
    photos.filter(p => selectedIds.has(p.id)).forEach(photo => {
      const link = document.createElement('a');
      link.href = photo.fileObject ? URL.createObjectURL(photo.fileObject) : (photo.webContentLink || '');
      link.download = photo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-card border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" title="Your Scan">
             <img src={userImage} alt="You" className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-lg" />
             <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold">
               Retake
             </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Found {photos.length} Matches
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs border border-primary/30">
                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Drag & Drop Ready'}
              </span>
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Drag photos to your desktop or WhatsApp to save them.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSelectionMode ? (
            <>
               <button 
                onClick={downloadSelected}
                disabled={selectedIds.size === 0}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download ({selectedIds.size})
              </button>
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsSelectionMode(true)}
                className="px-4 py-2 border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Select Photos
              </button>
              <button 
                onClick={onReset}
                className="px-4 py-2 bg-gray-800 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg text-sm transition-colors border border-transparent hover:border-red-500/20"
              >
                Exit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Light Table Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-darker/50">
        {photos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
            <p className="text-lg">No matches found yet.</p>
            <p className="text-sm">Scanning matches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {photos.map((photo) => {
              const displayUrl = photo.fileObject 
                ? URL.createObjectURL(photo.fileObject) 
                : photo.thumbnailLink;
              
              const isSelected = selectedIds.has(photo.id);

              return (
                <div 
                  key={photo.id} 
                  className={`
                    relative group aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                    ${isSelected ? 'ring-4 ring-primary shadow-lg scale-95' : 'hover:shadow-xl hover:ring-2 hover:ring-gray-600'}
                  `}
                  onClick={() => isSelectionMode && toggleSelection(photo.id)}
                >
                  <img 
                    src={displayUrl}
                    alt={photo.name}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, photo)}
                    className="w-full h-full object-cover bg-gray-900"
                    loading="lazy"
                  />
                  
                  {/* Selection Checkbox Overlay */}
                  {isSelectionMode && (
                    <div className="absolute top-2 right-2">
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/60'}`}>
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                       </div>
                    </div>
                  )}

                  {/* Drag Hint Overlay (Only when not selecting) */}
                  {!isSelectionMode && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
                       <span className="text-xs text-white truncate max-w-[80%]">{photo.name}</span>
                       <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                       </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
