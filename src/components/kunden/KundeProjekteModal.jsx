import { useEffect, useState, useCallback } from 'react';
import { Button, Modal, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { projektApi } from '../../api/projektApi';
import { API_ORIGIN } from '../../api/axiosClient';

const STORAGE_URL = API_ORIGIN;
const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${STORAGE_URL}${path}`;
};

export default function KundeProjekteModal({ kunde, onHide }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ---------- STATE MANAGEMENT ----------
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- EFFECTS & CALLBACKS ----------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projektApi.getByKunde(kunde.id);
      let projects = res.data?.items || res.data || [];
      const filteredProjects = projects.filter(p => p.kundeId === kunde.id);
      setList(filteredProjects);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[ProjekteModal] Load error:', err);
      }
    }
    setLoading(false);
  }, [kunde.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- STATUS BADGE HELPER ----------
  const getStatusColor = (status) => {
    switch (status) {
      case 'NichtGestartet': return 'secondary';
      case 'InBearbeitung': return 'primary';
      case 'Abgeschlossen': return 'success';
      case 'Pausiert': return 'warning';
      default: return 'secondary';
    }
  };

  const getPrioritaetColor = (prioritaet) => {
    switch (prioritaet) {
      case 'Niedrig': return 'info';
      case 'Mittel': return 'primary';
      case 'Hoch': return 'warning';
      case 'Kritisch': return 'danger';
      default: return 'secondary';
    }
  };

  // ---------- RENDER ----------
  return (
    <Modal show onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center mb-2 mt-2 w-100 ">
          <span className="me-auto"><i className="bi bi-folder2-open me-2"></i>{t('projekte.projekteFor')}</span>

          <div className="d-flex align-items-center gap-2 position-absolute start-50 translate-middle-x">
            {kunde.logo ? (
              <img
                src={imageUrl(kunde.logo)}
                alt="Logo"
                style={{ maxHeight: 32, maxWidth: 64, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }}
              />
            ) : (
              <i className="bi bi-folder" />
            )}
            <span>{kunde.unternehmen}</span>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-3"><Spinner size="sm" /></div>
        ) : (
          <>
            {list.length === 0 ? (
              <div className="text-center py-3 text-muted">
                <i className="bi bi-folder-x fs-1 d-block mb-2" />
                {t('projekte.noProjects')}
              </div>
            ) : (
              <ListGroup>
                {list.map((item) => (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="fs-6">{item.name}</strong>
                        <Badge bg={getStatusColor(item.status)} className="fw-normal small">
                          {item.status}
                        </Badge>
                        <Badge bg={getPrioritaetColor(item.prioritaet)} className="fw-normal small">
                          {item.prioritaet}
                        </Badge>
                      </div>
                      {item.beschreibung && (
                        <p className="mb-1 text-muted small">{item.beschreibung}</p>
                      )}

                      {item.benutzer && item.benutzer.length > 0 && (
                        <div className="mb-2">
                          <small className="text-muted me-2">
                            <i className="bi bi-people-fill me-1" />
                            {t('projekte.assignedUsers', 'Yetkililer')}:
                          </small>
                          {item.benutzer.map((user) => (
                            <Badge
                              key={user.id}
                              bg="info"
                              className="me-1 fw-normal"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-person-fill me-1" />
                              {user.vorname} {user.nachname}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="small text-muted">
                        {item.startdatum && (
                          <span className="me-3">
                            <i className="bi bi-calendar-event me-1" />
                            {item.startdatum.slice(0, 10)}
                          </span>
                        )}
                        {item.enddatum && (
                          <span className="me-3">
                            <i className="bi bi-calendar-check me-1" />
                            {item.enddatum.slice(0, 10)}
                          </span>
                        )}
                        {item.abschlussInProzent != null && (
                          <span>
                            <i className="bi bi-speedometer2 me-1" />
                            {item.abschlussInProzent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-2">
                      {item.istAbgeschlossen && (
                        <Badge bg="success">
                          <i className="bi bi-check-circle-fill me-1" />
                          Abgeschlossen
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="rounded-2"
                        onClick={() => {
                          onHide();
                          navigate('/projekte', { state: { selectedProjectId: item.id } });
                        }}
                        title="Projeye Git"
                      >
                        <i className="bi bi-arrow-right me-1" />
                        {t('projekte.goToProject', 'Projeye Git')}
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-2" onClick={onHide}>
          {t('common.close', 'Schließen')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
