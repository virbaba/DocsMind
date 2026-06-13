import React from 'react';
import { FiX, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#10121a] border border-[#20223a] rounded-2xl w-full max-w-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#52525b] hover:text-[#a1a1aa] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiX size={16} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-red-500">
          <FiTrash2 size={18} />
          <h3 className="text-sm font-bold text-white">{title || 'Delete Item'}</h3>
        </div>
        <p className="text-xs text-[#71717a] mb-6">
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2 px-4 bg-[#1a1c2e] hover:bg-[#20223a] border border-[#20223a] text-[#a1a1aa] hover:text-white rounded-xl text-[11px] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="py-2 px-4 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-[11px] font-semibold cursor-pointer transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isLoading && <FiRefreshCw size={12} className="animate-spin text-red-400 group-hover:text-white" />}
            <span>{isLoading ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
