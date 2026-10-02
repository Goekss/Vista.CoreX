import { Button, Modal } from 'react-bootstrap';
import { useLanguage } from '../../hooks/useLanguage';
import { API_ORIGIN } from '../../api/axiosClient';

const STORAGE_URL = API_ORIGIN;
const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${STORAGE_URL}${path}`;
};

export default function BenutzerViewModal({ show, item, onHide }) {
  const { t } = useLanguage();

  if (!item) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{t('benutzer.viewTitle') || 'Benutzer Details'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-2">
          {/* Avatar Display */}
          <div className="col-12 text-start mb-2">
            {item.bild ? (
              <img
                src={imageUrl(item.bild)}
                alt={item.vorname}
                style={{ width: 60, height: 60, borderRadius: '10%', objectFit: 'cover', border: '2px solid #ddd', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
              />
            ) : (
              <span className="bi bi-person-circle" style={{ fontSize: 60 }} />
            )}
          </div>

          {/* Vorname & Nachname */}
          <div className="col-6">
            <label className="fw-bold text-muted small">{t('kunden.firstName')}</label>
            <p className="mb-3">{item.vorname || '—'}</p>
          </div>
          <div className="col-6">
            <label className="fw-bold text-muted small">{t('kunden.lastName')}</label>
            <p className="mb-3">{item.nachname || '—'}</p>
          </div>

          {/* Email & Rolle */}
          <div className="col-md-6">
            <label className="fw-bold text-muted small">{t('auth.email')}</label>
            <p className="mb-3">{item.email || '—'}</p>
          </div>
          <div className="col-md-6">
            <label className="fw-bold text-muted small">{t('benutzer.role')}</label>
            <p className="mb-3">{item.rolle || '—'}</p>
          </div>

          {/* Abteilung & RufNummer */}
          <div className="col-md-6">
            <label className="fw-bold text-muted small">{t('benutzer.abteilung')}</label>
            <p className="mb-3">{item.abteilung || '—'}</p>
          </div>
          <div className="col-md-6">
            <label className="fw-bold text-muted small">{t('benutzer.rufNummer')}</label>
            <p className="mb-3">{item.rufNummer || '—'}</p>
          </div>

          {/* Hinweise */}
          <div className="col-12">
            <label className="fw-bold text-muted small">Hinweise</label>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{item.hinweise || '—'}</p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-2" onClick={onHide}>Schließen</Button>
      </Modal.Footer>
    </Modal>
  );
}
