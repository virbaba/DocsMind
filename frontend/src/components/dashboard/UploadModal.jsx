import React, { useRef, useState, useEffect } from 'react';
import { FiX, FiUploadCloud, FiFile, FiTrash2, FiSend } from 'react-icons/fi';

const UploadModal = ({ isOpen, onClose, isUploading, uploadProgress, onUpload }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Reset selected file state when modal open/close status changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleModalClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#10121a] border border-[#20223a] rounded-2xl w-full max-w-md p-6 shadow-[0_8px_40px_rgba(0,0,0,0.7)] relative">
        <button
          onClick={handleModalClose}
          disabled={isUploading}
          className="absolute top-4 right-4 text-[#52525b] hover:text-[#a1a1aa] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiX size={16} />
        </button>

        <h3 className="text-sm font-bold text-white mb-1">Upload PDF Document</h3>
        <p className="text-xs text-[#71717a] mb-5 font-normal">Select a PDF to index into DocsMind AI.</p>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a1a1aa] font-medium">
                {uploadProgress < 100 ? 'Uploading PDF file…' : 'Finalizing server upload…'}
              </span>
              <span className="text-[#818cf8] font-mono font-bold">{Math.min(uploadProgress, 100)}%</span>
            </div>
            <div className="h-1.5 bg-[#1a1c2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-[#52525b] text-center italic font-normal">
              {uploadProgress < 100 
                ? 'Streaming chunks to secure server...'
                : 'Spawning background worker for Vector indexing...'}
            </div>
          </div>
        ) : selectedFile ? (
          /* File Preview & Submit Container */
          <div className="space-y-4">
            <div className="border border-[#2c2f4d] rounded-xl p-4 bg-[#1a1c2e]/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-[#5b4fd4]/10 border border-[#5b4fd4]/20 flex items-center justify-center text-[#818cf8] shrink-0">
                  <FiFile size={20} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-[#e4e4e7] truncate">{selectedFile.name}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5">{formatBytes(selectedFile.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-[#71717a] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Remove file"
              >
                <FiTrash2 size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleUploadSubmit}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white rounded-xl py-3 text-xs font-semibold tracking-wide transition-all duration-200 shadow-[0_4px_20px_rgba(91,79,212,0.3)] hover:shadow-[0_6px_28px_rgba(91,79,212,0.45)] hover:-translate-y-px flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiSend size={14} />
              Upload & Index Document
            </button>
          </div>
        ) : (
          /* Dropzone / Select box */
          <div
            onClick={handleBoxClick}
            className="border-2 border-dashed border-[#2c2f4d] hover:border-[#5b4fd4]/50 rounded-xl p-10 text-center cursor-pointer bg-[#1a1c2e]/50 hover:bg-[#151130]/20 transition-all flex flex-col items-center gap-3 group"
          >
            <FiUploadCloud size={32} className="text-[#52525b] group-hover:text-[#818cf8] transition-colors" />
            <div>
              <div className="text-xs font-semibold text-[#e4e4e7] group-hover:text-[#a5b4fc] transition-colors">
                Click to select PDF
              </div>
              <div className="text-[10px] text-[#52525b] mt-1 font-normal">
                Only PDF files up to 20 MB are supported
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
