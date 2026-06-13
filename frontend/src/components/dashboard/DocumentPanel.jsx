import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiGrid, FiList, FiFileText, FiChevronRight, FiX, FiUploadCloud, FiMoreVertical, FiTrash2, FiEdit2, FiEye } from 'react-icons/fi';
import DocCard from './DocCard.jsx';

// Inline sub-component for List View row with 3-dot menu and inline renaming
const DocRow = ({ doc, isSelected, onClick, onOpen, onRename, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(doc.fullName || doc.name);
  
  const menuRef = useRef(null);

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
    if (window.confirm(`Are you sure you want to delete "${doc.fullName || doc.name}"?`)) {
      if (onDelete) onDelete(doc.id);
    }
  };

  const handleRowClick = () => {
    if (isEditing) return;
    onClick(doc);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group/row relative flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-[#151130]/60 border-[#5b4fd4]/40 text-[#d4c9ff]'
          : 'bg-[#141628] border-[#1e2035] hover:bg-[#171930] hover:border-[#2e3256] text-[#c4c4cf]'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isSelected ? 'bg-[#5b4fd4]/20 text-[#a29bfe]' : 'bg-[#1a1c2e] text-[#52525b]'
        }`}
      >
        <FiFileText size={16} />
      </div>
      
      <div className="flex-1 min-w-0 pr-8">
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
            className="bg-[#181a2e] border border-[#5b4fd4] rounded px-1.5 py-0.5 text-xs text-white outline-none font-medium w-full"
          />
        ) : (
          <div className="text-xs font-semibold truncate">{doc.fullName || doc.name}</div>
        )}
        <div className="text-[10px] text-[#52525b] flex gap-2 mt-0.5">
          <span>{doc.size}</span>
          <span>·</span>
          <span>{doc.category}</span>
        </div>
      </div>

      {/* Row 3-dot Menu */}
      {!isEditing && (
        <div ref={menuRef} className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={handleMenuToggle}
            className="p-1.5 bg-[#1a1c2e]/90 hover:bg-[#20223a] text-[#a1a1aa] hover:text-white rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover/row:opacity-100 shadow-sm cursor-pointer"
          >
            <FiMoreVertical size={13} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 bg-[#10121a] border border-[#20223a] rounded-lg shadow-xl py-1 z-30 min-w-[110px] flex flex-col overflow-hidden">
              <button
                onClick={handleOpenClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#e4e4e7] hover:bg-[#1c1f30] w-full text-left transition-colors cursor-pointer"
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
    </div>
  );
};

const DocumentPanel = ({
  selectedFolder,
  activeFolder,
  visibleDocs = [],
  selectedDocs = new Set(),
  onToggleSelect,
  viewMode = 'grid',
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  onUploadClick,
  onOpenDoc,
  onRenameDoc,
  onDeleteDoc,
}) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#0d0f18]">
      {/* Toolbar */}
      <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-[#1c1f30] bg-[#10121a]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white truncate">{activeFolder?.name ?? 'All Documents'}</h2>
          <span className="text-[10px] text-[#52525b] bg-[#1a1c2e] border border-[#20223a] rounded-md px-1.5 py-0.5 font-mono">
            {visibleDocs.length} files
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center">
            <FiSearch size={12} className="absolute left-2.5 text-[#52525b] pointer-events-none" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-[#1a1c2e] border border-[#20223a] rounded-lg py-1.5 pl-7 pr-3 text-[11px] text-[#e4e4e7] placeholder-[#52525b] outline-none focus:border-[#5b4fd4]/60 transition-colors w-40"
            />
          </div>

          {/* View toggles */}
          <div className="flex items-center bg-[#1a1c2e] border border-[#20223a] rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-[#5b4fd4]/30 text-[#a29bfe]' : 'text-[#52525b] hover:text-[#a1a1aa]'
              }`}
            >
              <FiGrid size={13} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-[#5b4fd4]/30 text-[#a29bfe]' : 'text-[#52525b] hover:text-[#a1a1aa]'
              }`}
            >
              <FiList size={13} />
            </button>
          </div>

          {/* Upload (Hidden on "All Documents") */}
          {selectedFolder !== 'all' && (
            <button
              onClick={onUploadClick}
              id="upload-pdf-btn"
              className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-[#5b4fd4] to-[#4035a8] hover:from-[#4b3ec2] hover:to-[#332a87] text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-all shadow-[0_2px_12px_rgba(91,79,212,0.25)] hover:shadow-[0_2px_16px_rgba(91,79,212,0.4)] hover:-translate-y-px"
            >
              <FiUploadCloud size={13} />
              Upload PDF
            </button>
          )}
        </div>
      </div>

      {/* Selected badge */}
      {selectedDocs.size > 0 && (
        <div className="px-4 py-2 border-b border-[#1c1f30] bg-[#141628]/40 flex items-center justify-between">
          <span className="text-[11px] text-[#a29bfe] font-medium flex items-center gap-1.5">
            <FiChevronRight size={12} />
            {selectedDocs.size} file(s) selected
          </span>
          <button
            onClick={() => onToggleSelect(null, true)} // Custom clear selection action
            className="text-[#52525b] hover:text-[#a1a1aa] cursor-pointer transition-colors"
          >
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* Document grid / list */}
      <div className="flex-1 overflow-y-auto p-4">
        {visibleDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1c2e] border border-[#20223a] flex items-center justify-center text-[#3f3f52]">
              <FiFileText size={24} />
            </div>
            <div className="text-sm text-[#52525b]">No documents found</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {visibleDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                isSelected={selectedDocs.has(doc.id)}
                onClick={onToggleSelect}
                onOpen={onOpenDoc}
                onRename={onRenameDoc}
                onDelete={onDeleteDoc}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {visibleDocs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                isSelected={selectedDocs.has(doc.id)}
                onClick={onToggleSelect}
                onOpen={onOpenDoc}
                onRename={onRenameDoc}
                onDelete={onDeleteDoc}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default DocumentPanel;
