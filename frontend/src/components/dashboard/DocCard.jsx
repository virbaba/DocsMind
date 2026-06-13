import React, { useState, useEffect, useRef } from 'react';
import { FiFileText, FiMoreVertical, FiTrash2, FiEdit2, FiEye, FiRefreshCw } from 'react-icons/fi';

const DocCard = ({ doc, isSelected, onClick, onOpen, onRename, onDelete, onRetry }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(doc.fullName || doc.name);
  
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleOpenClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (doc.status && doc.status !== 'completed') return;
    if (onOpen) onOpen(doc);
  };

  const handleRenameStart = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsEditing(true);
    setRenameValue(doc.fullName || doc.name);
  };

  const handleRenameConfirm = () => {
    setIsEditing(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== doc.fullName) {
      if (onRename) {
        onRename(doc.id, trimmed);
      }
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) onDelete(doc.id);
  };

  const handleCardClick = () => {
    // If we are currently renaming, don't trigger selection toggle on card click
    if (isEditing) return;
    onClick(doc);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden flex flex-col ${
        isSelected
          ? 'border-[#5b4fd4]/60 bg-[#151130]/60 shadow-[0_0_0_1px_rgba(91,79,212,0.2),0_4px_20px_rgba(91,79,212,0.12)]'
          : 'border-[#1e2035] bg-[#141628] hover:border-[#2e3256] hover:bg-[#171930]'
      }`}
    >
      {/* Status Badge */}
      {doc.status && doc.status !== 'completed' && (
        doc.status === 'failed' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onRetry) onRetry(doc);
            }}
            className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wider border backdrop-blur-sm bg-[#2d0f0f]/95 border-[#ef4444]/40 text-[#f87171] hover:bg-[#3f1616] hover:border-[#ef4444]/60 transition-colors flex items-center gap-1 shadow-md cursor-pointer"
            title={`${doc.processingError || 'Indexing failed'}. Click to retry.`}
          >
            <FiRefreshCw size={8} />
            <span>Failed (Retry)</span>
          </button>
        ) : (
          <div
            className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
              doc.status === 'queued'
                ? 'bg-[#181a2e]/80 border-[#3b3db8]/30 text-[#818cf8] animate-pulse'
                : 'bg-[#261f18]/80 border-[#d97706]/30 text-[#f59e0b] animate-pulse'
            }`}
          >
            {doc.status === 'processing' ? 'Indexing' : doc.status}
          </div>
        )
      )}

      {/* 3-dot Menu Trigger */}
      {!isEditing && (
        <div ref={menuRef} className="absolute top-2 right-2 z-20">
          <button
            onClick={handleMenuToggle}
            className="p-1 bg-[#1a1c2e]/90 hover:bg-[#20223a] text-[#a1a1aa] hover:text-white rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-sm cursor-pointer"
          >
            <FiMoreVertical size={14} />
          </button>
          
          {/* Menu Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 bg-[#10121a] border border-[#20223a] rounded-lg shadow-xl py-1 z-30 min-w-[110px] flex flex-col overflow-hidden">
              <button
                onClick={handleOpenClick}
                disabled={doc.status && doc.status !== 'completed'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#e4e4e7] hover:bg-[#1c1f30] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed w-full text-left transition-colors cursor-pointer"
              >
                <FiEye size={12} className="text-[#a29bfe]" />
                Open
              </button>

              <button
                onClick={handleRenameStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#e4e4e7] hover:bg-[#1c1f30] w-full text-left transition-colors cursor-pointer"
              >
                <FiEdit2 size={12} className="text-[#a1a1aa]" />
                Rename
              </button>
              <div className="h-px bg-[#1c1f30] my-0.5" />
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400 hover:bg-[#2a1b20] w-full text-left transition-colors cursor-pointer"
              >
                <FiTrash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail area */}
      <div className={`aspect-[4/3] flex items-center justify-center relative ${
        isSelected ? 'bg-[#1d193b]' : 'bg-[#1a1c2e]'
      }`}>
        {/* PDF page lines decoration */}
        <div className="absolute inset-4 rounded-lg border border-[#2e3256] flex flex-col items-center justify-center gap-2">
          <FiFileText
            size={28}
            className={isSelected ? 'text-[#5b4fd4]' : 'text-[#3d3d52]'}
          />
          {/* Decorative lines */}
          <div className="w-full px-3 space-y-1.5">
            {[100, 80, 60].map((w, i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full ${isSelected ? 'bg-[#5b4fd4]/30' : 'bg-[#2e3256]'}`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="p-2.5">
        {isEditing ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setRenameValue(doc.fullName || doc.name);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-[#181a2e] border border-[#5b4fd4] rounded px-1.5 py-0.5 text-xs text-white outline-none font-medium"
          />
        ) : (
          <div className={`text-xs font-semibold truncate leading-tight ${isSelected ? 'text-[#d4c9ff]' : 'text-[#c4c4cf]'}`}>
            {doc.fullName || doc.name}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-mono ${isSelected ? 'text-[#a29bfe]' : 'text-[#52525b]'}`}>
            {doc.size}
          </span>
          <span className={`text-[10px] truncate ${isSelected ? 'text-[#7065c7]' : 'text-[#4e527a]'}`}>
            {doc.category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocCard;
