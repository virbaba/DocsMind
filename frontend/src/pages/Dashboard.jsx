import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Imports from extracted files
import useResize from '../hooks/useResize.js';
import { INITIAL_CHAT } from '../data/dashboardData.js';
import Divider from '../components/dashboard/Divider.jsx';
import FolderSidebar from '../components/dashboard/FolderSidebar.jsx';
import DocumentPanel from '../components/dashboard/DocumentPanel.jsx';
import AIPanel from '../components/dashboard/AIPanel.jsx';
import UploadModal from '../components/dashboard/UploadModal.jsx';
import PDFViewerModal from '../components/dashboard/PDFViewerModal.jsx';
import CreateFolderModal from '../components/dashboard/CreateFolderModal.jsx';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal.jsx';
import axiosInstance from '../api/axiosInstance.js';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Panel drag-resize sizes
  const sidebar = useResize({ minPx: 140, maxPx: 320, initialPx: 180, side: 'right' });
  const aiPanel = useResize({ minPx: 260, maxPx: 560, initialPx: 320, side: 'left' });

  // Core state variables
  const [folders, setFolders] = useState([]);
  const [viewedFolder, setViewedFolder] = useState('all'); // switches middle panel view
  const [chatFolders, setChatFolders] = useState(new Set(['all'])); // multiple chat folder context
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleFolder = (folderId) => {
    setChatFolders((prev) => {
      const next = new Set(prev);
      if (folderId === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next.size === 0 ? new Set(['all']) : next;
    });
  };

  const handleClearFolders = () => {
    setChatFolders(new Set(['all']));
  };
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [chatHistory, setChatHistory] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState([]);

  // Toast notifications state and helper
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4500);
  };

  // New features state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [openDoc, setOpenDoc] = useState(null); // Track opened PDF
  const [docToDelete, setDocToDelete] = useState(null); // Track document to confirm delete
  const [isDeletingDoc, setIsDeletingDoc] = useState(false); // Track delete loading state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false); // Custom create folder modal
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Load initial folders and documents from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foldersRes, docsRes] = await Promise.all([
          axiosInstance.get('/folders'),
          axiosInstance.get('/documents'),
        ]);

        const fetchedFolders = foldersRes.data.map((f) => ({
          id: f._id,
          name: f.name,
        }));
        setFolders(fetchedFolders);

        const fetchedDocs = docsRes.data.map((d) => ({
          id: d._id,
          name: d.name,
          fullName: d.fullName,
          size: d.size,
          category: d.category,
          folder: d.folder, // Folder ObjectId or null
          url: d.url,
          status: d.status || 'completed',
          processingError: d.processingError || null,
        }));
        setDocuments(fetchedDocs);
      } catch (err) {
        console.error('Error fetching dashboard initial data:', err);
      }
    };
    fetchData();
  }, []);

  // Poll document statuses in background if any document is processing or queued
  useEffect(() => {
    const hasPendingDocs = documents.some((d) => d.status === 'queued' || d.status === 'processing');
    if (!hasPendingDocs) return;

    const interval = setInterval(async () => {
      try {
        const docsRes = await axiosInstance.get('/documents');
        const fetchedDocs = docsRes.data.map((d) => ({
          id: d._id,
          name: d.name,
          fullName: d.fullName,
          size: d.size,
          category: d.category,
          folder: d.folder,
          url: d.url,
          status: d.status || 'completed',
          processingError: d.processingError || null,
        }));

        setDocuments((prevDocs) => {
          const idToPrevStatus = new Map(prevDocs.map((d) => [d.id, d.status]));
          fetchedDocs.forEach((newDoc) => {
            const prevStatus = idToPrevStatus.get(newDoc.id);
            if (prevStatus && prevStatus !== newDoc.status) {
              if (newDoc.status === 'completed') {
                showToast(`"${newDoc.name}" has been successfully indexed and is ready!`, 'success');
              } else if (newDoc.status === 'failed') {
                showToast(`Failed to index "${newDoc.name}": ${newDoc.processingError || 'Unknown error'}`, 'error');
              }
            }
          });
          return fetchedDocs;
        });
      } catch (err) {
        console.error('Error polling document statuses:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  // Filtered documents for middle panel based on viewedFolder
  const visibleDocs = documents.filter((doc) => {
    const matchFolder = viewedFolder === 'all' || doc.folder === viewedFolder;
    const matchSearch =
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFolder && matchSearch;
  });

  // Dynamic folder counting (always prepends "All Documents" virtual folder)
  const foldersWithCounts = [
    { id: 'all', name: 'All Documents' },
    ...folders,
  ].map((f) => {
    const count =
      f.id === 'all'
        ? documents.length
        : documents.filter((d) => d.folder === f.id).length;
    return { ...f, count };
  });

  // activeFolder controls DocumentPanel title info (switched only from left)
  const activeFolder = foldersWithCounts.find((f) => f.id === viewedFolder);

  // Folder action handlers
  const handleNewFolderSubmit = async (folderName) => {
    try {
      const response = await axiosInstance.post('/folders', { name: folderName });
      const newFolder = {
        id: response.data._id,
        name: response.data.name,
      };
      setFolders((prev) => [...prev, newFolder]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating folder.');
    }
  };

  const handleRenameFolder = async (id, newName) => {
    try {
      const response = await axiosInstance.put(`/folders/${id}`, { name: newName });
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: response.data.name } : f))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error renaming folder.');
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await axiosInstance.delete(`/folders/${id}`);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      
      // Reset viewedFolder or chatFolders to 'all' if they were the deleted one
      if (viewedFolder === id) {
        setViewedFolder('all');
      }
      setChatFolders((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        }
        return next.size === 0 ? new Set(['all']) : next;
      });

      // In local state, set documents previously inside this folder to loose (null)
      setDocuments((prev) =>
        prev.map((d) => (d.folder === id ? { ...d, folder: null } : d))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting folder.');
    }
  };

  // Toggle selection handler
  const handleToggleSelect = (doc, clearAll = false) => {
    if (clearAll) {
      setSelectedDocs(new Set());
      return;
    }
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(doc.id)) next.delete(doc.id);
      else next.add(doc.id);
      return next;
    });
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  // AI chat send handler
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || isAiTyping) return;

    const newUserMsg = { sender: 'user', text: msg };
    const updatedHistoryWithUser = [...chatHistory, newUserMsg];

    setChatInput('');
    setChatHistory(updatedHistoryWithUser);
    setIsAiTyping(true);

    try {
      let activeConvId = currentConversationId;
      let title = undefined;

      if (!activeConvId) {
        title = msg.substring(0, 30);
        if (msg.length > 30) title += '...';
      }

      // Save user message to backend
      const saveRes = await axiosInstance.post('/conversations', {
        id: activeConvId,
        title,
        messages: updatedHistoryWithUser.map((m) => ({ sender: m.sender, text: m.text })),
      });

      if (!activeConvId) {
        activeConvId = saveRes.data._id;
        setCurrentConversationId(activeConvId);
      }

      setTimeout(async () => {
        const selectedCount = selectedDocs.size;
        let reply = '';
        if (selectedCount > 0) {
          reply = `I am analyzing the ${selectedCount} selected document${
            selectedCount > 1 ? 's' : ''
          } across folders. What would you like to know about them?`;
        } else {
          if (chatFolders.has('all')) {
            reply = `I am analyzing all documents in the "All Documents" context. Ask me anything about their contents!`;
          } else {
            const names = folders
              .filter((f) => chatFolders.has(f.id))
              .map((f) => f.name);
            if (names.length === 0) {
              reply = `I am analyzing all documents in the "All Documents" context. Ask me anything about their contents!`;
            } else {
              const formattedNames = names.join(', ');
              reply = `I am analyzing all documents in the "${formattedNames}" folder${
                names.length > 1 ? 's' : ''
              } context. Ask me anything about their contents!`;
            }
          }
        }

        const newAiMsg = { sender: 'ai', text: reply };
        const finalHistory = [...updatedHistoryWithUser, newAiMsg];
        setChatHistory(finalHistory);
        setIsAiTyping(false);

        // Save AI response
        await axiosInstance.post('/conversations', {
          id: activeConvId,
          messages: finalHistory.map((m) => ({ sender: m.sender, text: m.text })),
        });
      }, 1000);

    } catch (err) {
      console.error('Error saving conversation:', err);
      setTimeout(() => {
        const reply = `I am running in local-only fallback mode. How can I assist you?`;
        setChatHistory((prev) => [...prev, { sender: 'ai', text: reply }]);
        setIsAiTyping(false);
      }, 1000);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setChatHistory(INITIAL_CHAT);
  };

  const handleLoadConversation = async (convId) => {
    try {
      const res = await axiosInstance.get(`/conversations/${convId}`);
      if (res.data.messages && res.data.messages.length > 0) {
        setChatHistory(
          res.data.messages.map((m) => ({
            sender: m.sender,
            text: m.text,
          }))
        );
      } else {
        setChatHistory(INITIAL_CHAT);
      }
      setCurrentConversationId(convId);
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading conversation.');
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await axiosInstance.delete(`/conversations/${convId}`);
      if (currentConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting conversation.');
    }
  };

  // Real Axios PDF upload implementation
  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (viewedFolder !== 'all') {
      formData.append('folderId', viewedFolder);
    }

    try {
      const response = await axiosInstance.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      const newDoc = {
        id: response.data._id,
        name: response.data.name,
        fullName: response.data.fullName,
        size: response.data.size,
        category: response.data.category,
        folder: response.data.folder,
        url: response.data.url,
        status: response.data.status || 'queued',
        processingError: response.data.processingError || null,
      };

      setDocuments((d) => [newDoc, ...d]);
      setIsUploading(false);
      setIsUploadOpen(false);
      setUploadProgress(0);
      showToast('Document uploaded successfully. Indexing started!', 'success');
    } catch (err) {
      setIsUploading(false);
      setIsUploadOpen(false);
      setUploadProgress(0);
      const msg = err.response?.data?.message || 'Error uploading PDF file.';
      showToast(msg, 'error');
    }
  };

  // Retry document indexing
  const handleRetryDoc = async (doc) => {
    try {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: 'queued', processingError: null } : d))
      );
      showToast(`Restarting indexing for "${doc.name}"...`, 'success');
      const response = await axiosInstance.post(`/documents/${doc.id}/retry`);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: response.data.status,
                processingError: response.data.processingError || null,
              }
            : d
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Error restarting indexing process.';
      showToast(msg, 'error');
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: 'failed' } : d))
      );
    }
  };

  // Rename handler
  const handleRenameDoc = async (id, newName) => {
    try {
      const response = await axiosInstance.put(`/documents/${id}`, { fullName: newName });
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            return {
              ...doc,
              fullName: response.data.fullName,
              name: response.data.name,
            };
          }
          return doc;
        })
      );
      showToast('Document renamed successfully.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error renaming document.';
      showToast(msg, 'error');
    }
  };

  // Delete handler
  const handleDeleteDoc = async (id) => {
    try {
      setIsDeletingDoc(true);
      await axiosInstance.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('Document deleted successfully.', 'success');
      setDocToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error deleting document.';
      showToast(msg, 'error');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const triggerDeleteDocConfirm = (id) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDocToDelete(doc);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0c0d12] text-[#e4e4e7] flex flex-col overflow-hidden font-sans select-none">
      {/* Topbar */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#10121a] border-b border-[#1c1f30] z-30">
        <div className="flex items-center gap-2.5">
          <img src="/images/docs_mind_logo.png?v=3" alt="DocsMind" className="w-8.5 h-8.5 object-contain" />
          <span className="text-[15px] font-extrabold tracking-tight bg-gradient-to-r from-white to-[#a29bfe] bg-clip-text text-transparent">
            DocsMind
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1c2e] border border-[#20223a] rounded-full py-1 pl-1 pr-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#5b4fd4] to-[#3f34b2] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(91,79,212,0.4)]">
              {user?.email?.[0] ?? user?.name?.[0] ?? 'U'}
            </div>
            <span className="text-[11px] text-[#a1a1aa] font-medium">
              {user?.email?.split('@')[0] ?? user?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-1.5 py-1.5 px-3 bg-[#1a1c2e] hover:bg-red-500/10 border border-[#20223a] hover:border-red-500/25 text-[#71717a] hover:text-red-400 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150"
          >
            <FiLogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main layout body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel 1 — Folder Sidebar */}
        <FolderSidebar
          width={sidebar.size}
          folders={foldersWithCounts}
          selectedFolder={viewedFolder}
          onSelectFolder={setViewedFolder}
          onOpenAiPanel={() => setIsAiPanelOpen(true)}
          onNewFolder={() => setIsCreateFolderOpen(true)}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {/* Drag Divider 1 */}
        <Divider onMouseDown={sidebar.onMouseDown} />

        {/* Panel 2 — Document Grid / List */}
        <DocumentPanel
          selectedFolder={viewedFolder}
          activeFolder={activeFolder}
          visibleDocs={visibleDocs}
          selectedDocs={selectedDocs}
          onToggleSelect={handleToggleSelect}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUploadClick={() => setIsUploadOpen(true)}
          onOpenDoc={setOpenDoc}
          onRenameDoc={handleRenameDoc}
          onDeleteDoc={triggerDeleteDocConfirm}
          onRetryDoc={handleRetryDoc}
        />

        {/* Collapsible Panel 3 — AI Assistant */}
        {isAiPanelOpen && (
          <>
            {/* Drag Divider 2 */}
            <Divider onMouseDown={aiPanel.onMouseDown} />

            <AIPanel
              width={aiPanel.size}
              onClose={() => setIsAiPanelOpen(false)}
              selectedDocs={selectedDocs}
              chatHistory={chatHistory}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendChat={handleSendChat}
              isAiTyping={isAiTyping}
              user={user}
              folders={foldersWithCounts}
              selectedFolders={chatFolders}
              onToggleFolder={handleToggleFolder}
              onClearFolders={handleClearFolders}
              onClearDocs={() => setSelectedDocs(new Set())}
              currentConversationId={currentConversationId}
              onNewChat={handleNewChat}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
        }}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={handleUpload}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleNewFolderSubmit}
        existingFolders={foldersWithCounts}
      />

      <PDFViewerModal doc={openDoc} onClose={() => setOpenDoc(null)} />

      <ConfirmDeleteModal
        isOpen={docToDelete !== null}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => handleDeleteDoc(docToDelete.id)}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.fullName || docToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeletingDoc}
      />

      {/* Toast Notifications Overlay */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div
            className={`px-4.5 py-3 rounded-xl border text-xs font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center gap-3 backdrop-blur-md transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-[#0f2d19]/80 border-[#22c55e]/30 text-[#4ade80]'
                : 'bg-[#2d0f0f]/80 border-[#ef4444]/30 text-[#f87171]'
            }`}
          >
            {toast.type === 'success' ? (
              <FiCheckCircle size={15} className="text-[#4ade80]" />
            ) : (
              <FiAlertCircle size={15} className="text-[#f87171]" />
            )}
            <span className="tracking-wide">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-0.5 hover:bg-white/10 rounded transition-colors text-[#a1a1aa] hover:text-white cursor-pointer ml-1"
            >
              <FiX size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
