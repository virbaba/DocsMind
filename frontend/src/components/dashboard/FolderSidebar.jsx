import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFolder, FiPlus, FiCpu, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

const FolderItem = ({
  folder,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const menuRef = useRef(null);

  // Close dropdown on click outside
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

  const handleRenameStart = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsEditing(true);
    setRenameValue(folder.name);
  };

  const handleRenameConfirm = () => {
    setIsEditing(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(folder.id, trimmed);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      onDelete(folder.id);
    }
  };

  const handleItemClick = () => {
    if (isEditing) return;
    onSelect(folder.id);
  };

  return (
    <div
      onClick={handleItemClick}
      className={`group/folder relative w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer rounded-none border-l-2 ${
        isActive
          ? 'bg-[#2d1f6e] text-white border-[#5b4fd4]'
          : 'text-[#8b8b9a] hover:bg-[#1a1c2e] hover:text-[#d4d4d8] border-transparent'
      }`}
    >
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <FiFolder size={13} className="text-[#a29bfe] shrink-0" />
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setRenameValue(folder.name);
              }
            }}
            autoFocus
            className="flex-1 bg-[#181a2e] border border-[#5b4fd4] rounded px-1.5 py-0.5 text-xs text-white outline-none font-medium"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 truncate pr-4">
            <FiFolder size={13} className={isActive ? 'text-[#a29bfe]' : 'text-[#52525b]'} />
            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center shrink-0">
            {/* Show badge by default, menu trigger on hover if not 'all' */}
            {folder.id === 'all' ? (
              <span className={`text-[11px] font-bold ${isActive ? 'text-[#a29bfe]' : 'text-[#4e527a]'}`}>
                {folder.count}
              </span>
            ) : (
              <div className="flex items-center">
                <span className={`text-[11px] font-bold group-hover/folder:hidden ${isActive ? 'text-[#a29bfe]' : 'text-[#4e527a]'}`}>
                  {folder.count}
                </span>

                <div ref={menuRef} className="hidden group-hover/folder:block relative leading-none">
                  <button
                    onClick={handleMenuToggle}
                    className="p-0.5 hover:bg-[#20223a] text-[#a1a1aa] hover:text-white rounded transition-colors cursor-pointer"
                  >
                    <FiMoreVertical size={13} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 bg-[#10121a] border border-[#20223a] rounded-lg shadow-xl py-1 z-30 min-w-[90px] flex flex-col overflow-hidden">
                      <button
                        onClick={handleRenameStart}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#e4e4e7] hover:bg-[#1c1f30] w-full text-left transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={11} className="text-[#a1a1aa]" />
                        Rename
                      </button>
                      <div className="h-px bg-[#1c1f30] my-0.5" />
                      <button
                        onClick={handleDeleteClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400 hover:bg-[#2a1b20] w-full text-left transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={11} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const FolderSidebar = ({
  width,
  folders = [],
  selectedFolder,
  onSelectFolder,
  onOpenAiPanel,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
}) => {
  const [folderQuery, setFolderQuery] = useState('');

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(folderQuery.toLowerCase())
  );

  return (
    <aside
      className="shrink-0 flex flex-col bg-[#10121a] border-r border-[#1c1f30] overflow-hidden transition-all duration-150"
      style={{ width }}
    >
      {/* Search folders */}
      <div className="p-2.5 border-b border-[#1c1f30]">
        <div className="relative flex items-center">
          <FiSearch size={11} className="absolute left-2.5 text-[#52525b] pointer-events-none" />
          <input
            type="text"
            placeholder="Search folders..."
            value={folderQuery}
            onChange={(e) => setFolderQuery(e.target.value)}
            className="w-full bg-[#181a2e] border border-[#20223a] rounded-lg py-1.5 pl-7 pr-2 text-[11px] text-[#e4e4e7] placeholder-[#52525b] outline-none focus:border-[#5b4fd4]/60 transition-colors"
          />
        </div>
      </div>

      {/* Folder list */}
      <nav className="flex-1 overflow-y-auto py-1.5">
        {filteredFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={selectedFolder === folder.id}
            onSelect={onSelectFolder}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
          />
        ))}
      </nav>

      {/* New Folder + AI shortcut */}
      <div className="p-2.5 border-t border-[#1c1f30] space-y-1.5">
        <button
          onClick={onNewFolder}
          className="w-full flex items-center gap-2 py-2 px-3 bg-[#1a1c2e] hover:bg-[#20223a] border border-[#20223a] rounded-lg text-[11px] font-semibold text-[#a1a1aa] hover:text-white cursor-pointer transition-all"
        >
          <FiPlus size={13} className="text-[#5b4fd4]" />
          New Folder
        </button>
        <button
          onClick={onOpenAiPanel}
          className="w-full flex items-center gap-2 py-2 px-3 bg-[#181a2e] hover:bg-[#1f223f] border border-[#2e335b]/60 rounded-lg text-[11px] font-semibold text-[#a29bfe] hover:text-[#c4b5fd] cursor-pointer transition-all"
        >
          <FiCpu size={13} className="text-[#5b4fd4]" />
          AI Assistant
        </button>
      </div>
    </aside>
  );
};

export default FolderSidebar;
