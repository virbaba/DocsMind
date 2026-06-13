import React, { useState } from 'react';
import { FiX, FiFolder } from 'react-icons/fi';

const CreateFolderModal = ({ isOpen, onClose, onCreate, existingFolders = [] }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      setError('Folder name cannot be empty.');
      return;
    }

    const id = trimmedName.toLowerCase().replace(/\s+/g, '-');
    if (existingFolders.some((f) => f.id === id || f.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A folder with this name already exists.');
      return;
    }

    onCreate(trimmedName);
    setFolderName('');
    onClose();
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#10121a] border border-[#20223a] rounded-2xl w-full max-w-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.7)] relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#52525b] hover:text-[#a1a1aa] cursor-pointer transition-colors"
        >
          <FiX size={16} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#5b4fd4]">
          <FiFolder size={18} />
          <h3 className="text-sm font-bold text-white">Create New Folder</h3>
        </div>
        <p className="text-xs text-[#71717a] mb-4">Enter a name for your new document collection.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Folder name (e.g. Contracts)"
              autoFocus
              className="w-full bg-[#1a1c2e] border border-[#20223a] focus:border-[#5b4fd4]/60 rounded-xl py-2.5 px-3.5 text-xs text-[#e4e4e7] placeholder-[#3f3f52] outline-none transition-colors"
            />
            {error && (
              <span className="text-[10px] text-red-400 mt-1.5 block font-medium">
                {error}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 bg-[#1a1c2e] hover:bg-[#20223a] border border-[#20223a] text-[#a1a1aa] hover:text-white rounded-xl text-[11px] font-semibold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-gradient-to-r from-[#5b4fd4] to-[#4035a8] hover:from-[#4b3ec2] hover:to-[#332a87] text-white rounded-xl text-[11px] font-semibold cursor-pointer transition-all shadow-[0_2px_8px_rgba(91,79,212,0.25)] hover:shadow-[0_2px_12px_rgba(91,79,212,0.4)]"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
