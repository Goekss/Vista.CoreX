import { getAvatarUrl } from '../../api/axiosClient';
import {
  bytesToMb,
  formatDateTime,
  getFileIconClass,
  fullName,
  initials,
  isImageFile,
  QUICK_REACTIONS,
} from './chatUtils';

export default function ChatMessageItem({
  message: n,
  user,
  t,
  editingMessageId,
  editText,
  setEditText,
  saveEditMessage,
  cancelEditMessage,
  startEditMessage,
  deleteMessage,
  addReaction,
  actionMenuForId,
  setActionMenuForId,
  reactionPickerForId,
  setReactionPickerForId,
}) {
  const isOwn = n.absenderId === user?.id;
  const senderName = fullName(n.absender) || n.absenderName || t('chat.user');
  const bild = isOwn ? user?.bild : n.absender?.bild;
  const isEditing = editingMessageId === n.id;
  const reactions = Array.isArray(n.reaksiyonlar) ? n.reaksiyonlar : [];

  return (
    <div className={`chat-msg-row ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <span className="chat-msg-avatar-wrap">
          {bild ? (
            <img
              className="chat-msg-avatar chat-msg-avatar-img"
              src={getAvatarUrl(bild)}
              alt={senderName}
            />
          ) : (
            <span className="chat-msg-avatar">{initials(senderName)}</span>
          )}
        </span>
      )}
      <div className="chat-bubble">
        <span className="chat-bubble-author">
          {isOwn ? (fullName(user) || user?.email || t('chat.user')) : senderName}
        </span>
        {isEditing ? (
          <div className="chat-edit-wrap">
            <input
              className="chat-edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={4000}
            />
            <div className="chat-edit-actions">
              <button
                type="button"
                className="chat-msg-action-btn"
                onClick={() => saveEditMessage(n)}
              >
                <i className="bi bi-check2" />
              </button>
              <button
                type="button"
                className="chat-msg-action-btn"
                onClick={cancelEditMessage}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>
        ) : n.istDatei ? (
          <div className="chat-file-msg">
            {isImageFile(n) ? (
              <>
                <a
                  className="chat-file-link chat-file-link-image"
                  href={getAvatarUrl(n.dateiPfad)}
                  download={n.dateiName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="chat-file-image"
                    src={getAvatarUrl(n.dateiPfad)}
                    alt={n.dateiName}
                  />
                  <span className="chat-file-meta">{n.dateiName} · {bytesToMb(n.dateiGroesse)}</span>
                </a>
                <a
                  className="chat-file-download-btn"
                  href={getAvatarUrl(n.dateiPfad)}
                  download={n.dateiName}
                  title={t('common.download', 'Download')}
                >
                  <i className="bi bi-download" />
                </a>
              </>
            ) : (
              <>
                <a
                  className="chat-file-link chat-file-link-doc"
                  href={getAvatarUrl(n.dateiPfad)}
                  download={n.dateiName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`bi ${getFileIconClass(n)} chat-file-icon`} />
                  <span className="chat-file-meta">{n.dateiName} · {bytesToMb(n.dateiGroesse)}</span>
                </a>
                <a
                  className="chat-file-download-btn"
                  href={getAvatarUrl(n.dateiPfad)}
                  download={n.dateiName}
                  title={t('common.download', 'Download')}
                >
                  <i className="bi bi-download" />
                </a>
              </>
            )}
          </div>
        ) : (
          <div>{n.inhalt}</div>
        )}

        {!n.istDatei && reactions.length > 0 && (
          <div className="chat-reactions-row">
            {reactions.map((r, idx) => (
              <span key={`${r.emoji}-${idx}`} className="chat-reaction-pill">
                {r.emoji} {r.adet || r.count || 1}
              </span>
            ))}
          </div>
        )}

        <div className="chat-msg-actions">
          <button
            type="button"
            className="chat-msg-action-btn"
            title={t('common.actions', 'Actions')}
            onClick={() => {
              setActionMenuForId((prev) => (prev === n.id ? null : n.id));
              setReactionPickerForId(null);
            }}
          >
            <i className="bi bi-three-dots" />
          </button>
        </div>

        {actionMenuForId === n.id && (
          <div className="chat-msg-actions-menu">
            {isOwn && !n.istDatei && !isEditing && (
              <button
                type="button"
                className="chat-msg-action-item"
                onClick={() => startEditMessage(n)}
              >
                <i className="bi bi-pencil-square" />
                {t('common.edit', 'Edit')}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                className="chat-msg-action-item danger"
                onClick={() => deleteMessage(n)}
              >
                <i className="bi bi-trash3" />
                {t('common.delete', 'Delete')}
              </button>
            )}
            <button
              type="button"
              className="chat-msg-action-item"
              onClick={() => addReaction(n, '👍')}
            >
              <i className="bi bi-hand-thumbs-up" />
              {t('chat.like', 'Like')}
            </button>
            <button
              type="button"
              className="chat-msg-action-item"
              onClick={() => setReactionPickerForId((prev) => (prev === n.id ? null : n.id))}
            >
              <i className="bi bi-emoji-smile" />
              {t('chat.reaction', 'Reaction')}
            </button>
            {reactionPickerForId === n.id && (
              <div className="chat-emoji-picker">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="chat-emoji-btn"
                    onClick={() => addReaction(n, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <span className="chat-bubble-time">{formatDateTime(n.geschicktAm)}</span>
      </div>

      {isOwn && (
        <span className="chat-msg-avatar-wrap chat-msg-avatar-wrap-own">
          {bild ? (
            <img
              className="chat-msg-avatar chat-msg-avatar-img"
              src={getAvatarUrl(bild)}
              alt={fullName(user) || user?.email || t('chat.user')}
            />
          ) : (
            <span className="chat-msg-avatar">
              {initials(fullName(user) || user?.email || t('chat.user'))}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
