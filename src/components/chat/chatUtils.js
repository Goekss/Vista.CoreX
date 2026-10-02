export const initials = (text = '') =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const formatTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(11, 16);
  }
};

export const fullName = (u) => [u?.vorname, u?.nachname].filter(Boolean).join(' ').trim();

export const bytesToMb = (bytes) => {
  const num = Number(bytes || 0);
  if (!Number.isFinite(num) || num <= 0) return '0.0 MB';
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const getExtension = (fileName = '') => {
  const parts = String(fileName).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const isImageFile = (file) => {
  const type = String(file?.dateiTyp || '').toLowerCase();
  const ext = getExtension(file?.dateiName);
  if (type.startsWith('image/')) return true;
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

export const getFileIconClass = (file) => {
  const type = String(file?.dateiTyp || '').toLowerCase();
  const ext = getExtension(file?.dateiName);
  if (type.includes('pdf') || ext === 'pdf') return 'bi-file-earmark-pdf';
  if (type.includes('word') || ['doc', 'docx'].includes(ext)) return 'bi-file-earmark-word';
  if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'bi-file-earmark-excel';
  if (type.includes('video') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'bi-file-earmark-play';
  if (type.includes('zip') || ['zip', 'rar', '7z'].includes(ext)) return 'bi-file-earmark-zip';
  if (type.includes('text') || ['txt', 'md', 'json', 'xml'].includes(ext)) return 'bi-file-earmark-text';
  return 'bi-file-earmark';
};

export const getOtherTeilnehmer = (room, currentUserId) => {
  if (!Array.isArray(room?.teilnehmer)) return [];
  return room.teilnehmer.filter((p) => p?.id !== currentUserId);
};

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '😮'];

export const isEndpointUnsupported = (err) => {
  const status = err?.response?.status;
  return status === 404 || status === 405 || status === 501;
};
