import React from 'react';
import { FiX, FiUploadCloud } from 'react-icons/fi';

const UploadModal = ({ isOpen, onClose, isUploading, uploadProgress, onUpload }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#10121a] border border-[#20223a] rounded-2xl w-full max-w-md p-6 shadow-[0_8px_40px_rgba(0,0,0,0.7)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#52525b] hover:text-[#a1a1aa] cursor-pointer transition-colors"
        >
          <FiX size={16} />
        </button>

        <h3 className="text-sm font-bold text-white mb-1">Upload PDF Document</h3>
        <p className="text-xs text-[#71717a] mb-5">Select a PDF to index into DocsMind AI.</p>

        {isUploading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a1a1aa]">Indexing document…</span>
              <span className="text-[#5b4fd4] font-mono font-semibold">{Math.min(uploadProgress, 100)}%</span>
            </div>
            <div className="h-1.5 bg-[#1a1c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5b4fd4] to-[#a29bfe] rounded-full transition-all duration-150"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#52525b] text-center italic">
              Running OCR and context extraction…
            </div>
          </div>
        ) : (
          <div
            onClick={onUpload}
            className="border-2 border-dashed border-[#2c2f4d] hover:border-[#5b4fd4]/50 rounded-xl p-10 text-center cursor-pointer bg-[#1a1c2e]/50 hover:bg-[#151130]/20 transition-all flex flex-col items-center gap-3 group"
          >
            <FiUploadCloud size={32} className="text-[#52525b] group-hover:text-[#5b4fd4] transition-colors" />
            <div>
              <div className="text-xs font-semibold text-[#e4e4e7] group-hover:text-[#a29bfe] transition-colors">Click to select PDF</div>
              <div className="text-[10px] text-[#52525b] mt-0.5">Up to 20 MB supported</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
