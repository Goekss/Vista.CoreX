import { useEffect, useState, useCallback } from 'react';
import { Button, Modal, Form, Alert, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { useLanguage } from '../../hooks/useLanguage';
import { ansprechpartnerApi } from '../../api/ansprechpartnerApi';
import { filialeApi } from '../../api/filialeApi';

export default function AnsprechpartnerModal({ kunde, onHide }) {
  const { t } = useLanguage();

  // ---------- STATE MANAGEMENT ----------
  const [list, setList] = useState([]);
  const [filialen, setFilialen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', telefon: '', email: '', abteilung: '', filialeId: '' });
  const [error, setError] = useState('');

  // ---------- EFFECTS & CALLBACKS ----------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ansprechpartnerApi.getByKunde(kunde.id);
      setList(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [kunde.id]);

  const loadFilialen = useCallback(async () => {
    try {
      const res = await filialeApi.getByKunde(kunde.id);
      setFilialen(res.data || []);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Ansprechpartner] Filialen load error:', err);
      }
    }
  }, [kunde.id]);

  useEffect(() => {
    load();
    loadFilialen();
  }, [load, loadFilialen]);

  // ---------- HANDLERS ----------
  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', telefon: '', email: '', abteilung: '', filialeId: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      telefon: item.telefon || '',
      email: item.email || '',
      abteilung: item.abteilung || '',
      filialeId: item.filialeId || ''
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        telefon: form.telefon.trim(),
        email: form.email.trim(),
        abteilung: form.abteilung.trim(),
        filialeId: form.filialeId || null,
        kundeId: kunde.id
      };

      if (editItem) {
        await ansprechpartnerApi.update(editItem.id, payload);
      } else {
        await ansprechpartnerApi.create(payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Ansprechpartner] Save error:', err);
      }
      setError(err.response?.data?.message || t('common.saveError', 'Fehler beim Speichern'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await ansprechpartnerApi.delete(id);
      load();
    } catch { /* ignore */ }
  };

  // ---------- RENDER ----------
  return (
    <Modal show onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person-lines-fill me-2" />
          Ansprechpartner — {kunde.unternehmen}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-3"><Spinner size="sm" /></div>
        ) : (
          <>
            {!showForm ? (
              <>
                {/* === ANSPRECHPARTNER LIST === */}
                <div className="d-flex justify-content-end mb-2">
                  <Button size="sm" className="rounded-2" onClick={openNew}>
                    <i className="bi bi-plus-lg me-1" /> Neu
                  </Button>
                </div>
                <ListGroup>
                  {list.length === 0 && (
                    <ListGroup.Item className="text-muted">{t('common.noData')}</ListGroup.Item>
                  )}
                  {list.map((item) => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{item.name}</strong>
                        {item.abteilung && <span className="ms-2 text-muted small">{item.abteilung}</span>}
                        {item.filiale && (
                          <span className="ms-2">
                            <Badge bg="secondary" className="fw-normal small">
                              <i className="bi bi-building me-1" />{item.filiale.name}
                            </Badge>
                          </span>
                        )}
                        <div className="small text-muted">
                          {item.telefon && <span className="me-3"><i className="bi bi-telephone me-1" />{item.telefon}</span>}
                          {item.email && <span><i className="bi bi-envelope me-1" />{item.email}</span>}
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <Button size="sm" variant="outline-primary" className="rounded-2" onClick={() => openEdit(item)}>
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button size="sm" variant="outline-danger" className="rounded-2" onClick={() => handleDelete(item.id)}>
                          <i className="bi bi-trash" />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            ) : (
              <>
                {/* === ANSPRECHPARTNER FORM === */}
                <Form onSubmit={handleSave}>
                  {error && <Alert variant="danger">{error}</Alert>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control required value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <Form.Label>Abteilung</Form.Label>
                      <Form.Control value={form.abteilung}
                        onChange={(e) => setForm({ ...form, abteilung: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <Form.Label>Telefon</Form.Label>
                      <Form.Control value={form.telefon}
                        onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <Form.Label>E-Mail</Form.Label>
                      <Form.Control type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <Form.Label>Filiale</Form.Label>
                      <Form.Select
                        value={form.filialeId}
                        onChange={(e) => setForm({ ...form, filialeId: e.target.value })}
                      >
                        <option value="">{t('common.select', 'Auswählen')}...</option>
                        {filialen.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} {f.adresse && `— ${f.adresse}`}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted small">
                        Optional: Ordnen Sie diesen Ansprechpartner einer bestimmten Filiale zu
                      </Form.Text>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Button type="submit" variant="primary" className="rounded-2">{t('common.save')}</Button>
                    <Button variant="secondary" className="rounded-2" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                  </div>
                </Form>
              </>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
