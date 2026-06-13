import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

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

  // New features state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [openDoc, setOpenDoc] = useState(null); // Track opened PDF
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
        }));
        setDocuments(fetchedDocs);
      } catch (err) {
        console.error('Error fetching dashboard initial data:', err);
      }
    };
    fetchData();
  }, []);

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

  // Mock upload implementation (indexed directly to MongoDB database)
  const handleMockUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const names = ['Research-Notes-2026.pdf', 'Project-Brief-v3.pdf', 'Contract-Draft.pdf'];
    const picked = names[Math.floor(Math.random() * names.length)];

    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 20;
      });
    }, 100);

    setTimeout(async () => {
      try {
        const payload = {
          fullName: picked,
          size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
          category: viewedFolder === 'all' ? 'Project Docs' : activeFolder?.name || 'Project Docs',
          folderId: viewedFolder === 'all' ? null : viewedFolder,
        };

        const response = await axiosInstance.post('/documents', payload);
        const newDoc = {
          id: response.data._id,
          name: response.data.name,
          fullName: response.data.fullName,
          size: response.data.size,
          category: response.data.category,
          folder: response.data.folder,
          url: response.data.url,
        };
        setDocuments((d) => [newDoc, ...d]);
        setIsUploading(false);
        setIsUploadOpen(false);
        setUploadProgress(0);
      } catch (err) {
        clearInterval(interval);
        setIsUploading(false);
        setIsUploadOpen(false);
        setUploadProgress(0);
        alert(err.response?.data?.message || 'Error uploading document.');
      }
    }, 600);
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
    } catch (err) {
      alert(err.response?.data?.message || 'Error renaming document.');
    }
  };

  // Delete handler
  const handleDeleteDoc = async (id) => {
    try {
      await axiosInstance.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting document.');
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
          onDeleteDoc={handleDeleteDoc}
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
        onUpload={handleMockUpload}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleNewFolderSubmit}
        existingFolders={foldersWithCounts}
      />

      <PDFViewerModal doc={openDoc} onClose={() => setOpenDoc(null)} />
    </div>
  );
};

export default Dashboard;
