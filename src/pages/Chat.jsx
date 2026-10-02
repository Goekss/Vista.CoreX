import { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { chatApi } from '../api/chatApi';
import { benutzerApi } from '../api/benutzerApi';
import { getAvatarUrl } from '../api/axiosClient';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import axiosClient from '../api/axiosClient';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import ChatInput from '../components/chat/ChatInput';
import {
  initials,
  fullName,
  getOtherTeilnehmer,
  isEndpointUnsupported,
} from '../components/chat/chatUtils';
import '../styles/Chat.css';

export default function Chat() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('raeume'); // 'raeume' | 'users'
  const [allUsers, setAllUsers] = useState([]);
  const [raeume, setRaeume] = useState([]);
  const [activeRaum, setActiveRaum] = useState(null);
  const [nachrichten, setNachrichten] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [reactionPickerForId, setReactionPickerForId] = useState(null);
  const [actionMenuForId, setActionMenuForId] = useState(null);
  const [raumIdForFile, setRaumIdForFile] = useState(null);
  
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  // Room presence
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  // Global presence
  const [globalOnlineUserIds, setGlobalOnlineUserIds] = useState(() => new Set());
  
  const [typingUserIds, setTypingUserIds] = useState(() => new Set());
  const typingTimersRef = useRef(new Map());

  const messagesEndRef = useRef(null);
  const activeRaumIdRef = useRef(null);
  useEffect(() => {
    activeRaumIdRef.current = activeRaum?.id ?? null;
  }, [activeRaum]);

  const currentUserIdRef = useRef(null);
  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user]);

  const onReceive = useMemo(
    () => ({
      ReceiveMessage: (message) => {
        if (message.raumId !== activeRaumIdRef.current) return;
        setNachrichten((prev) => {
          if (message.id && prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      OnlineUsers: (ids) => {
        const normalizedIds = Array.isArray(ids) ? ids.map(String).map(id => id.toLowerCase()) : [];
        setOnlineUserIds(new Set(normalizedIds));
      },
      UserJoined: (userId) => {
        if (!userId) return;
        const uid = String(userId).toLowerCase();
        setOnlineUserIds((prev) => {
          if (prev.has(uid)) return prev;
          const next = new Set(prev);
          next.add(uid);
          return next;
        });
      },
      UserLeft: (userId) => {
        if (!userId) return;
        setOnlineUserIds((prev) => {
          if (!prev.has(userId)) return prev;
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      },
      GlobalUserOnlineStatus: (payload) => {
        if (!payload || !payload.userId) return;
        const uid = String(payload.userId).toLowerCase();
        setGlobalOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (payload.isOnline) {
            next.add(uid);
          } else {
            next.delete(uid);
          }
          return next;
        });
      },
      UserTyping: (payload) => {
        if (!payload) return;
        const { userId, raumId } = payload;
        if (!userId || raumId !== activeRaumIdRef.current) return;
        if (userId === currentUserIdRef.current) return;

        setTypingUserIds((prev) => {
          if (prev.has(userId)) return prev;
          const next = new Set(prev);
          next.add(userId);
          return next;
        });

        const existing = typingTimersRef.current.get(userId);
        if (existing) clearTimeout(existing);
        const tid = setTimeout(() => {
          typingTimersRef.current.delete(userId);
          setTypingUserIds((prev) => {
            if (!prev.has(userId)) return prev;
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, 3000);
        typingTimersRef.current.set(userId, tid);
      },
    }),
    []
  );

  const { invoke, connected, status, reconnect, reconnectAttempt } = useSignalR('/hubs/chat', {
    onReceive,
  });

  // Get global online users on connect
  useEffect(() => {
    if (connected) {
      invoke('GetOnlineUsers').then(ids => {
        if (Array.isArray(ids)) {
          setGlobalOnlineUserIds(new Set(ids.map(id => String(id).toLowerCase())));
        }
      }).catch(() => {});
    }
  }, [connected, invoke]);

  useEffect(() => {
    return () => {
      typingTimersRef.current.forEach((tid) => clearTimeout(tid));
      typingTimersRef.current.clear();
    };
  }, []);

  // Initial Data Load
  useEffect(() => {
    chatApi
      .getRaeume()
      .then((res) => {
        const list = res.data || [];
        setRaeume(list);
        if (list.length > 0) setActiveRaum((prev) => prev || list[0]);
      })
      .catch((err) => setError(err.response?.data?.message || t('chat.loadError')))
      .finally(() => setLoadingRooms(false));

    benutzerApi
      .getAll(1, 1000)
      .then((res) => {
        const list = res.data || [];
        setAllUsers(list.filter(u => u.id !== user?.id));
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startDirectChat = async (zielUserId) => {
    try {
      const res = await chatApi.getOrCreateDirektChat(zielUserId);
      const raumId = res.data.id;
      // OdalarÄ± yenile
      const roomsRes = await chatApi.getRaeume();
      setRaeume(roomsRes.data || []);
      const newActive = (roomsRes.data || []).find(r => r.id === raumId);
      if (newActive) {
        setActiveRaum(newActive);
        setActiveTab('raeume');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const previousRoomIdRef = useRef(null);
  useEffect(() => {
    if (!activeRaum) return;
    setLoadingMsgs(true);
    setSendError('');
    chatApi
      .getNachrichten(activeRaum.id)
      .then((res) => {
        // Backend returns { total, page, size, items } â€” items already ASC chronological
        const items = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
        setNachrichten(items);
      })
      .catch(() => setNachrichten([]))
      .finally(() => setLoadingMsgs(false));

    // Reset per-room state on room switch
    setOnlineUserIds(new Set());
    setTypingUserIds(new Set());
    typingTimersRef.current.forEach((tid) => clearTimeout(tid));
    typingTimersRef.current.clear();

    if (connected) {
      const prevId = previousRoomIdRef.current;
      if (prevId && prevId !== activeRaum.id) {
        invoke('LeaveRoom', prevId.toString()).catch(() => {});
      }
      invoke('JoinRoom', activeRaum.id.toString()).catch(() => {});
      previousRoomIdRef.current = activeRaum.id;
    }
    // `invoke` reads from a ref inside useSignalR; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRaum, connected]);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nachrichten, typingUserIds]);

  // Throttle Typing invocations â€” at most once per 2s
  const lastTypingSentRef = useRef(0);
  const handleInputChange = (e) => {
    setNewMsg(e.target.value);
    if (!connected || !activeRaum) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      invoke('Typing', activeRaum.id.toString()).catch(() => {});
    }
  };

  const sendMessage = async () => {
    const trimmed = newMsg.trim();
    if (!trimmed || !activeRaum || !connected) return;
    if (trimmed.length > 4000) {
      setSendError(t('chat.tooLong', 'Message is too long (max 4000 chars).'));
      return;
    }
    try {
      await invoke('SendMessage', activeRaum.id.toString(), trimmed);
      setNewMsg('');
      setSendError('');
      // Server will broadcast ReceiveMessage back to us
    } catch (err) {
      setSendError(err?.message || t('chat.loadError'));
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !raumIdForFile || !connected) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSendError(t('chat.fileTooLarge', 'File size must be less than 100MB'));
      return;
    }
    const formData = new FormData();
    formData.append('datei', file);
    try {
      await axiosClient.post(`/chat/raum/${raumIdForFile}/datei`, formData);
      setSendError('');
    } catch (err) {
      setSendError(err.response?.data?.message || t('chat.fileUploadError', 'File upload failed'));
    }
  };

  const startEditMessage = (msg) => {
    if (!msg?.id || msg?.istDatei) return;
    setActionMenuForId(null);
    setEditingMessageId(msg.id);
    setEditText(msg.inhalt || '');
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const saveEditMessage = async (msg) => {
    const trimmed = editText.trim();
    if (!msg?.id || !trimmed) return;
    try {
      await chatApi.updateNachricht(msg.id, trimmed);
      setNachrichten((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, inhalt: trimmed, bearbeitet: true } : m))
      );
      cancelEditMessage();
      setSendError('');
    } catch (err) {
      if (isEndpointUnsupported(err)) {
        setNachrichten((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, inhalt: trimmed, bearbeitet: true } : m))
        );
        cancelEditMessage();
        setSendError(t('chat.editLocalOnly', 'Edit endpoint not available on server. Applied locally.'));
        return;
      }
      setSendError(err.response?.data?.message || t('chat.editError', 'Message update failed'));
    }
  };

  const deleteMessage = async (msg) => {
    if (!msg?.id) return;
    try {
      await chatApi.deleteNachricht(msg.id);
      setNachrichten((prev) => prev.filter((m) => m.id !== msg.id));
      setSendError('');
    } catch (err) {
      if (isEndpointUnsupported(err)) {
        setNachrichten((prev) => prev.filter((m) => m.id !== msg.id));
        setSendError(t('chat.deleteLocalOnly', 'Delete endpoint not available on server. Removed locally.'));
        return;
      }
      setSendError(err.response?.data?.message || t('chat.deleteError', 'Message delete failed'));
    }
  };

  const addReaction = async (msg, emoji) => {
    if (!msg?.id || !emoji) return;
    const applyReactionLocal = () => {
      setNachrichten((prev) =>
        prev.map((m) => {
          if (m.id !== msg.id) return m;
          const reactions = Array.isArray(m.reaksiyonlar) ? [...m.reaksiyonlar] : [];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (idx >= 0) {
            reactions[idx] = { ...reactions[idx], adet: (reactions[idx].adet || 0) + 1 };
          } else {
            reactions.push({ emoji, adet: 1 });
          }
          return { ...m, reaksiyonlar: reactions };
        })
      );
    };
    applyReactionLocal();
    try {
      await chatApi.addReaktion(msg.id, emoji);
      setReactionPickerForId(null);
      setActionMenuForId(null);
      setSendError('');
    } catch (err) {
      if (isEndpointUnsupported(err)) {
        setReactionPickerForId(null);
        setActionMenuForId(null);
        setSendError(t('chat.reactionLocalOnly', 'Reaction endpoint not available on server. Applied locally.'));
        return;
      }
      setReactionPickerForId(null);
      setActionMenuForId(null);
      setSendError(err.response?.data?.message || t('chat.reactionError', 'Reaction saved locally.'));
    }
  };

  const canSend = connected && !!activeRaum && newMsg.trim().length > 0;

  // Compute room display info â€” partner avatar/name for 1-1, room name otherwise
  const getRoomDisplay = (room) => {
    const others = getOtherTeilnehmer(room, user?.id);
    if (others.length === 1) {
      const p = others[0];
      return {
        title: fullName(p) || room.name,
        bild: p.bild,
        partnerId: p.id,
        isGroup: false,
      };
    }
    return {
      title: room.name,
      bild: null,
      partnerId: null,
      isGroup: others.length > 1,
    };
  };

  const activeDisplay = activeRaum ? getRoomDisplay(activeRaum) : null;

  useEffect(() => {
    setRaumIdForFile(activeRaum?.id ?? null);
  }, [activeRaum?.id]);

  // Names of users currently typing in active room
  const typingNames = useMemo(() => {
    if (!activeRaum || typingUserIds.size === 0) return [];
    const others = getOtherTeilnehmer(activeRaum, user?.id);
    return Array.from(typingUserIds)
      .map((id) => {
        const p = others.find((o) => o.id === id);
        return p ? fullName(p) || t('chat.user') : null;
      })
  }, [activeRaum, typingUserIds, user?.id, t]);

  return (
    <div className={`chat-page m-0 m-md-3 ${isMobileChatOpen ? 'mobile-chat-open' : ''}`}>
      <ChatSidebar
        t={t}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        reconnectAttempt={reconnectAttempt}
        reconnect={reconnect}
        error={error}
        loadingRooms={loadingRooms}
        raeume={raeume}
        activeRaum={activeRaum}
        setActiveRaum={setActiveRaum}
        setRaumIdForFile={setRaumIdForFile}
        setIsMobileChatOpen={setIsMobileChatOpen}
        globalOnlineUserIds={globalOnlineUserIds}
        onlineUserIds={onlineUserIds}
        getRoomDisplay={getRoomDisplay}
        loadingUsers={loadingUsers}
        allUsers={allUsers}
        startDirectChat={startDirectChat}
      />

      {/* Main */}
      <section className="chat-main">
        {!activeRaum || !activeDisplay ? (
          <div className="chat-empty">
            <i className="bi bi-chat-square-text" />
            <div>{t('chat.chooseRoom')}</div>
          </div>
        ) : (
          <>
            <div className="chat-main-header">
              <button
                type="button"
                className="chat-back-btn d-lg-none me-2"
                onClick={() => setIsMobileChatOpen(false)}
              >
                <i className="bi bi-arrow-left" />
              </button>
              <span className="chat-room-avatar-wrap">
                {activeDisplay.bild ? (
                  <img
                    className="chat-room-avatar chat-room-avatar-img"
                    src={getAvatarUrl(activeDisplay.bild)}
                    alt={activeDisplay.title}
                  />
                ) : (
                  <span className="chat-room-avatar">
                    {activeDisplay.isGroup ? (
                      <i className="bi bi-people-fill" />
                    ) : (
                      initials(activeDisplay.title)
                    )}
                  </span>
                )}
                {activeDisplay.partnerId && globalOnlineUserIds.has(String(activeDisplay.partnerId).toLowerCase()) && (
                  <span className="chat-presence-dot online" />
                )}
              </span>
              <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                <strong className="text-truncate">{activeDisplay.title}</strong>
                {(() => {
                  if (activeDisplay.partnerId) {
                    const on = globalOnlineUserIds.has(String(activeDisplay.partnerId).toLowerCase());
                    return (
                      <span className={`chat-room-status ${on ? 'online' : 'offline'}`}>
                        {on ? t('common.online', 'Online') : t('common.offline', 'Offline')}
                      </span>
                    );
                  }
                  let othersOnline = 0;
                  globalOnlineUserIds.forEach((id) => {
                    if (id !== String(user?.id).toLowerCase()) othersOnline += 1;
                  });
                  if (othersOnline > 0) {
                    return (
                      <span className="chat-room-status online">
                        {othersOnline}{' '}
                        {t(
                          othersOnline === 1 ? 'chat.oneOnline' : 'chat.manyOnline',
                          othersOnline === 1 ? 'user online' : 'users online'
                        )}
                      </span>
                    );
                  }
                  return (
                    <span className="chat-room-status offline">
                      {t('chat.noOthersOnline', 'No one else online yet')}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="chat-body">
              {loadingMsgs ? (
                <div className="d-flex justify-content-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : nachrichten.length === 0 && typingNames.length === 0 ? (
                <div className="chat-empty">
                  <i className="bi bi-inbox" />
                  <div>{t('chat.noMessages', 'No messages yet')}</div>
                </div>
              ) : (
                <>
                  {nachrichten.map((n, i) => (
                    <ChatMessageItem
                      key={n.id ?? i}
                      message={n}
                      user={user}
                      t={t}
                      editingMessageId={editingMessageId}
                      editText={editText}
                      setEditText={setEditText}
                      saveEditMessage={saveEditMessage}
                      cancelEditMessage={cancelEditMessage}
                      startEditMessage={startEditMessage}
                      deleteMessage={deleteMessage}
                      addReaction={addReaction}
                      actionMenuForId={actionMenuForId}
                      setActionMenuForId={setActionMenuForId}
                      reactionPickerForId={reactionPickerForId}
                      setReactionPickerForId={setReactionPickerForId}
                    />
                  ))}
                  {typingNames.length > 0 && (
                    <div className="chat-typing-row">
                      <span className="chat-typing-bubble">
                        <span className="chat-typing-dots">
                          <span /><span /><span />
                        </span>
                        <span className="chat-typing-text">
                          {typingNames.length === 1
                            ? `${typingNames[0]} ${t('chat.isTyping', 'is typing…')}`
                            : `${typingNames.length} ${t('chat.areTyping', 'people typing…')}`}
                        </span>
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <ChatInput
              t={t}
              newMsg={newMsg}
              handleInputChange={handleInputChange}
              sendMessage={sendMessage}
              connected={connected}
              canSend={canSend}
              sendError={sendError}
              raumIdForFile={raumIdForFile}
              handleFileUpload={handleFileUpload}
            />
          </>
        )}
      </section>
    </div>
  );
}

