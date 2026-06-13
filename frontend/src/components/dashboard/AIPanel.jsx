import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiX, FiFolder, FiChevronRight, FiSend, FiChevronDown, FiPlus, FiClock, FiTrash2, FiMic, FiMicOff } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import axiosInstance from '../../api/axiosInstance.js';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx';

const AIPanel = ({
  width,
  onClose,
  selectedDocs = new Set(),
  chatHistory = [],
  chatInput = '',
  onChatInputChange,
  onSendChat,
  isAiTyping = false,
  user,
  folders = [],
  selectedFolders = new Set(['all']),
  onToggleFolder,
  onClearFolders,
  onClearDocs,
  currentConversationId,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
}) => {
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const onChatInputChangeRef = useRef(onChatInputChange);
  const onSendChatRef = useRef(onSendChat);

  // Keep refs up-to-date with changing props
  useEffect(() => {
    onChatInputChangeRef.current = onChatInputChange;
    onSendChatRef.current = onSendChat;
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          if (onChatInputChangeRef.current) {
            onChatInputChangeRef.current(transcript);
          }
          if (onSendChatRef.current) {
            onSendChatRef.current(null, transcript);
          }
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Safari, or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const threshold = 100; // px threshold
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight <= threshold;
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) {
      fetchConversations();
    }
  }, [isHistoryOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Auto-scroll to bottom of chat if user is near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAiTyping]);

  const hasAllSelected = selectedFolders.has('all');

  const handleFolderSelect = (e, folderId) => {
    e.stopPropagation();
    if (onToggleFolder) onToggleFolder(folderId);
  };

  return (
    <aside
      className="shrink-0 flex flex-col bg-[#10121a] border-l border-[#1c1f30] overflow-hidden relative"
      style={{ width }}
    >
      {/* Header */}
      <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-[#1c1f30]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#5b4fd4] to-[#7b70e7] flex items-center justify-center">
            <FiCpu size={11} className="text-white" />
          </div>
          <span className="text-xs font-bold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewChat}
            title="New Chat"
            className="p-1.5 hover:bg-[#1a1c2e] rounded text-[#8b8b9a] hover:text-[#a29bfe] transition-colors cursor-pointer shadow-none"
          >
            <FiPlus size={14} />
          </button>
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            title="Chat History"
            className={`p-1.5 hover:bg-[#1a1c2e] rounded transition-colors cursor-pointer ${
              isHistoryOpen ? 'text-[#a29bfe] bg-[#1a1c2e]' : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            <FiClock size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1a1c2e] rounded text-[#52525b] hover:text-red-400 transition-colors cursor-pointer"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>

      {/* Selected context badge */}
      <div className="px-3 py-2 border-b border-[#1c1f30] space-y-2">
        {/* Custom Multi-Folder selection dropdown */}
        <div ref={dropdownRef} className="flex flex-col gap-1 relative">
          <span className="text-[9px] text-[#52525b] font-bold uppercase tracking-wider pl-1">
            Chat Folder Context
          </span>

          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex flex-wrap items-center justify-between w-full bg-[#1a1c2e] border border-[#20223a] hover:border-[#2e3256] rounded-xl p-2.5 cursor-pointer text-xs text-[#e4e4e7] gap-2 select-none group min-h-[38px]"
          >
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {hasAllSelected ? (
                <div className="flex items-center gap-2 truncate text-xs text-[#e4e4e7]">
                  <FiFolder size={13} className="text-[#a29bfe] shrink-0" />
                  <span className="truncate font-semibold">All Documents</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {folders.filter(f => selectedFolders.has(f.id)).map(f => (
                    <span
                      key={f.id}
                      className="flex items-center gap-1 bg-[#2d1f6e] border border-[#5b4fd4]/30 rounded-md px-2 py-0.5 text-[10px] text-white font-medium"
                    >
                      {f.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleFolder) onToggleFolder(f.id);
                        }}
                        className="hover:text-red-400 p-0.5 text-white/50 hover:text-white cursor-pointer transition-colors"
                      >
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Unselect/Clear Folder Selection button */}
              {!hasAllSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClearFolders) onClearFolders();
                  }}
                  title="Clear folder selection"
                  className="p-0.5 hover:bg-[#20223a] text-[#52525b] hover:text-red-400 rounded transition-colors cursor-pointer"
                >
                  <FiX size={12} />
                </button>
              )}
              <FiChevronDown
                size={14}
                className={`text-[#52525b] group-hover:text-[#a1a1aa] transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Custom Dropdown Menu Options */}
          {isDropdownOpen && (
            <div className="absolute top-[100%] left-0 right-0 mt-1.5 bg-[#10121a] border border-[#20223a] rounded-xl shadow-2xl py-1 z-40 max-h-52 overflow-y-auto flex flex-col scrollbar-thin">
              {folders.map((f) => {
                const isActive = selectedFolders.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={(e) => handleFolderSelect(e, f.id)}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer w-full text-left outline-none ${
                      isActive
                        ? 'bg-[#2d1f6e]/30 text-[#a29bfe] font-bold'
                        : 'text-[#8b8b9a] hover:bg-[#1a1c2e] hover:text-[#d4d4d8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FiFolder size={12} className={isActive ? 'text-[#a29bfe]' : 'text-[#42445e]'} />
                      <span className="truncate">{f.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-[#a29bfe]' : 'text-[#42445e]'}`}>
                        {f.count}
                      </span>
                      {/* Show visual checkbox indicator for custom folders */}
                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${
                        isActive ? 'border-[#5b4fd4] bg-[#5b4fd4] text-white' : 'border-[#42445e] bg-transparent'
                      }`}>
                        {isActive && <span className="text-[8px] font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected files count if > 0 */}
        {selectedDocs.size > 0 && (
          <div className="flex items-center justify-between bg-[#151130]/50 border border-[#5b4fd4]/30 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2 text-[11px] text-[#a29bfe]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fd4] animate-pulse shrink-0" />
              <span className="font-medium truncate">{selectedDocs.size} file(s) selected</span>
            </div>
            <button
              onClick={onClearDocs}
              className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer underline shrink-0 font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {chatHistory.map((msg, i) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={i} className={`flex gap-2 ${isAi ? '' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              {isAi && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#5b4fd4] to-[#7b70e7] flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
                  AI
                </div>
              )}

              <div className={`max-w-[82%] ${isAi ? '' : 'flex flex-col items-end'}`}>
                {isAi && (
                  <div className="text-[9px] text-[#52525b] font-bold tracking-widest uppercase mb-1">
                    DOCMIND AI
                  </div>
                )}
                <div
                  className={`rounded-2xl py-2.5 px-3.5 text-xs leading-relaxed select-text ${
                    isAi
                      ? 'bg-[#1a1c2e] border border-[#20223a] text-[#d4d4d8] rounded-tl-none'
                      : 'bg-[#5b4fd4] text-white rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {isAiTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#5b4fd4] to-[#7b70e7] flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
              AI
            </div>
            <div className="bg-[#1a1c2e] border border-[#20223a] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#5b4fd4] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSendChat} className="p-3 border-t border-[#1c1f30] flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          placeholder={isListening ? "Listening... Speak your question now." : "Ask about your documents..."}
          disabled={isAiTyping || isListening}
          className="flex-1 bg-[#1a1c2e] border border-[#20223a] rounded-xl py-2.5 px-3.5 text-xs text-[#e4e4e7] placeholder-[#3f3f52] outline-none focus:border-[#5b4fd4]/60 transition-colors disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={isAiTyping}
          title={isListening ? "Stop listening" : "Ask with voice"}
          className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 border ${
            isListening
              ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : 'bg-[#1a1c2e] border-[#20223a] hover:border-[#2e3256] text-[#a29bfe] hover:text-[#c4c1fc]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isListening ? <FiMicOff size={13} /> : <FiMic size={13} />}
        </button>
        <button
          type="submit"
          id="chat-submit-btn"
          disabled={!chatInput.trim() || isAiTyping || isListening}
          className="w-8 h-8 bg-gradient-to-tr from-[#5b4fd4] to-[#4035a8] hover:from-[#4b3ec2] rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(91,79,212,0.3)] shrink-0"
        >
          {isAiTyping ? (
            <CgSpinner size={13} className="text-white animate-spin" />
          ) : (
            <FiSend size={13} className="text-white" />
          )}
        </button>
      </form>

      {/* History Drawer */}
      {isHistoryOpen && (
        <div className="absolute inset-0 bg-[#0c0d12]/95 backdrop-blur-sm z-50 flex flex-col border-l border-[#1c1f30] animate-in slide-in-from-right duration-250">
          <div className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-[#1c1f30]">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <FiClock className="text-[#a29bfe]" /> Chat History
            </span>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1.5 hover:bg-[#1a1c2e] rounded text-[#52525b] hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                <FiClock size={24} className="text-[#3f3f52]" />
                <span className="text-xs text-[#52525b]">No chat history found</span>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={`group/conv flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#151130]/60 border-[#5b4fd4]/40 text-white font-bold'
                        : 'bg-[#141628] border-[#1e2035] hover:bg-[#171930] hover:border-[#2e3256] text-[#c4c4cf]'
                    }`}
                    onClick={() => {
                      onLoadConversation(conv.id);
                      setIsHistoryOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-semibold truncate">{conv.title}</div>
                      <div className="text-[9px] text-[#52525b] flex gap-2 mt-0.5">
                        <span>{conv.messageCount} messages</span>
                        <span>·</span>
                        <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(conv.id);
                      }}
                      className="p-1.5 bg-[#1a1c2e]/90 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-[#52525b] hover:text-red-400 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover/conv:opacity-100 cursor-pointer"
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {/* Custom delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await onDeleteConversation(deleteTargetId);
            fetchConversations();
          }
        }}
        title="Delete Chat Session"
        message="Are you sure you want to delete this chat session? All messages in this conversation will be permanently removed."
      />

    </aside>
  );
};

export default AIPanel;
