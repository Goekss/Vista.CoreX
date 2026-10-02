import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { getAvatarUrl } from '../../api/axiosClient';
import { fullName, initials } from './chatUtils';

export default function ChatSidebar({
  t,
  activeTab,
  setActiveTab,
  status,
  reconnectAttempt,
  reconnect,
  error,
  loadingRooms,
  raeume,
  activeRaum,
  setActiveRaum,
  setRaumIdForFile,
  setIsMobileChatOpen,
  globalOnlineUserIds,
  onlineUserIds,
  getRoomDisplay,
  loadingUsers,
  allUsers,
  startDirectChat,
}) {
  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h5 className="chat-sidebar-title mb-0 d-flex align-items-center">
          <i className="bi bi-chat-dots me-2" />
          Chat
        </h5>
        <span className={`chat-status-pill ${status}`}>
          <span className="dot" />
          {status === 'connected' && t('common.online', 'Online')}
          {status === 'connecting' && t('common.connecting', 'Connecting')}
          {status === 'reconnecting' && `Reconnect ${reconnectAttempt || ''}`}
          {status === 'disconnected' && t('common.offline', 'Offline')}
        </span>
      </div>

      <div className="px-2 px-md-3 pb-2">
        <ButtonGroup className="w-100" size="sm">
          <Button
            variant={activeTab === 'raeume' ? 'primary' : 'outline-primary'}
            onClick={() => setActiveTab('raeume')}
          >
            {t('chat.tabs.rooms', 'Räume')}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'outline-primary'}
            onClick={() => setActiveTab('users')}
          >
            {t('chat.tabs.users', 'Benutzer')}
          </Button>
        </ButtonGroup>
      </div>

      {status !== 'connected' && (
        <div className="chat-reconnect-row">
          <Button size="sm" variant="outline-secondary" onClick={reconnect}>
            <i className="bi bi-arrow-clockwise me-1" />
            {t('chat.connect')}
          </Button>
        </div>
      )}

      {error && <div className="chat-inline-error">{error}</div>}

      <div className="chat-room-list">
        {activeTab === 'raeume' && (
          loadingRooms ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner size="sm" />
            </div>
          ) : raeume.length === 0 ? (
            <div className="chat-room-empty">{t('chat.noRooms')}</div>
          ) : (
            raeume.map((r) => {
              const d = getRoomDisplay(r);
              const isActive = activeRaum?.id === r.id;
              let isPartnerOnline = false;
              if (r.istDirektChat && d.partnerId) {
                isPartnerOnline = globalOnlineUserIds.has(String(d.partnerId).toLowerCase());
              } else {
                isPartnerOnline = isActive && d.partnerId && onlineUserIds.has(d.partnerId);
              }

              return (
                <div
                  key={r.id}
                  className={`chat-room-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRaum(r);
                    setRaumIdForFile(r.id);
                    setIsMobileChatOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveRaum(r)}
                >
                  <span className="chat-room-avatar-wrap">
                    {d.bild ? (
                      <img
                        className="chat-room-avatar chat-room-avatar-img"
                        src={getAvatarUrl(d.bild)}
                        alt={d.title}
                      />
                    ) : (
                      <span className="chat-room-avatar">
                        {d.isGroup ? <i className="bi bi-people-fill" /> : initials(d.title)}
                      </span>
                    )}
                    <span className={`chat-presence-dot ${isPartnerOnline ? 'online' : 'offline'}`} />
                  </span>
                  <span className="chat-room-name">{d.title}</span>
                </div>
              );
            })
          )
        )}

        {activeTab === 'users' && (
          loadingUsers ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner size="sm" />
            </div>
          ) : allUsers.length === 0 ? (
            <div className="chat-room-empty">{t('chat.users.empty', 'Keine Benutzer gefunden')}</div>
          ) : (
            allUsers.map((u) => {
              const isOnline = globalOnlineUserIds.has(String(u.id).toLowerCase());
              const title = fullName(u);
              return (
                <div
                  key={u.id}
                  className="chat-room-item"
                  onClick={() => {
                    startDirectChat(u.id);
                    setRaumIdForFile(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startDirectChat(u.id)}
                >
                  <span className="chat-room-avatar-wrap">
                    {u.bild ? (
                      <img
                        className="chat-room-avatar chat-room-avatar-img"
                        src={getAvatarUrl(u.bild)}
                        alt={title}
                      />
                    ) : (
                      <span className="chat-room-avatar">
                        {initials(title)}
                      </span>
                    )}
                    <span className={`chat-presence-dot ${isOnline ? 'online' : 'offline'}`} />
                  </span>
                  <span className="chat-room-name">{title}</span>
                </div>
              );
            })
          )
        )}
      </div>
    </aside>
  );
}
