export default function ChatInput({
  t,
  newMsg,
  handleInputChange,
  sendMessage,
  connected,
  canSend,
  sendError,
  raumIdForFile,
  handleFileUpload,
}) {
  return (
    <div className="chat-input-area">
      {sendError && <div className="chat-inline-error mb-2">{sendError}</div>}
      <div className="chat-input-wrapper">
        <input
          className="chat-input"
          placeholder={t('chat.writeMessage')}
          value={newMsg}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!connected}
          maxLength={4000}
        />
        <button
          type="button"
          className={`chat-send-btn ${canSend ? 'active' : ''}`}
          onClick={sendMessage}
          disabled={!canSend}
          aria-label={t('common.send', 'Send')}
        >
          <i className="bi bi-send-fill" />
        </button>
        {/* File upload button */}
        {raumIdForFile && (
          <div className="chat-file-upload-wrapper">
            <input
              type="file"
              id="chat-file-input"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx,.zip,.rar,.txt"
            />
            <button
              type="button"
              className="chat-file-upload-btn"
              onClick={() => document.getElementById('chat-file-input')?.click()}
              title={t('chat.sendFile', 'Send file')}
              disabled={!connected}
            >
              <i className="bi bi-paperclip" />
            </button>
          </div>
        )}
      </div>
      {!connected && (
        <div className="chat-input-hint">
          <i className="bi bi-info-circle" />
          {t('chat.disconnectedHint', 'Disconnected — reconnect to send messages.')}
        </div>
      )}
    </div>
  );
}
