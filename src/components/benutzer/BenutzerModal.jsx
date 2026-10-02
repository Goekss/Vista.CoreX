import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { benutzerApi } from '../../api/benutzerApi';
import { ApiError } from '../../api/errorHandler';
import { useLanguage } from '../../hooks/useLanguage';
import { API_ORIGIN } from '../../api/axiosClient';

const rollen = ['SuperAdmin', 'Admin', 'Manager', 'Standard', 'NurLesen'];
const STORAGE_URL = API_ORIGIN;
const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${STORAGE_URL}${path}`;
};

export default function BenutzerModal({ show, initial, onHide, onSave, onRefresh }) {
  const { t } = useLanguage();
  const isEdit = !!initial;

  // ---------- STATE MANAGEMENT ----------
  const [form, setForm] = useState({
    vorname: '', nachname: '', email: '', rolle: 'Standard',
    passwort: '', rufNummer: '', abteilung: '', bild: '', hinweise: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [bildFile, setBildFile] = useState(null);
  const [bildError, setBildError] = useState('');
  const fileInputRef = useRef(null);

  // ---------- EFFECTS ----------
  useEffect(() => {
    if (initial) {
      setForm({
        vorname: initial.vorname || '',
        nachname: initial.nachname || '',
        email: initial.email || '',
        rolle: initial.rolle || 'Standard',
        passwort: '',
        rufNummer: initial.rufNummer || '',
        abteilung: initial.abteilung || '',
        bild: initial.bild || '',
        hinweise: initial.hinweise || '',
      });
    } else {
      setForm({
        vorname: '', nachname: '', email: '', rolle: 'Standard',
        passwort: '', rufNummer: '', abteilung: '', bild: '', hinweise: '',
      });
    }
    setFieldErrors({});
    setBildFile(null);
    setBildError('');
    setSaveError('');
    setSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [initial, show]);

  // ---------- HANDLERS: PROFILE IMAGE ----------
  const handleBildFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setBildError('Sadece PNG, JPEG, JPG formatları desteklenir');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBildError('Dosya boyutu 5MB den küçük olmalı');
      return;
    }
    setBildError('');
    setBildFile(file);
  };

  const handleBildDelete = async () => {
    if (!initial?.id) return;
    setBildError('');
    try {
      await benutzerApi.deleteAvatar(initial.id);
      setForm((f) => ({ ...f, bild: '' }));
      if (onRefresh) await onRefresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setBildError(err.message);
      } else {
        setBildError('Avatar silinirken hata oluştu');
      }
    }
  };

  const handleBildRemoveSelection = () => {
    setBildFile(null);
    setBildError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- HANDLERS: FORM SUBMIT ----------
  const submit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setFieldErrors({});
    setBildError('');
    setSaving(true);

    const payload = { ...form };
    if (isEdit) {
      delete payload.passwort;
      delete payload.email;
    }
    delete payload.bild;

    const cleaned = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value ?? '';
      }
    });

    try {
      const response = await onSave(cleaned);

      if (bildFile) {
        const userId = initial?.id || response?.data?.id;

        if (userId) {
          try {
            await benutzerApi.uploadAvatar(userId, bildFile);
          } catch (avatarErr) {
            if (avatarErr instanceof ApiError) {
              setBildError(`Kullanıcı kaydedildi ancak avatar yüklenemedi: ${avatarErr.message}`);
            } else {
              setBildError('Kullanıcı kaydedildi ancak avatar yüklenemedi');
            }
            setSaving(false);
            if (onRefresh) await onRefresh();
            return;
          }
        }
      }

      if (onRefresh) await onRefresh();
      onHide();
      setSaving(false);
    } catch (err) {
      setSaving(false);

      if (err instanceof ApiError) {
        if (err.message) {
          setSaveError(err.message);
        }
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setSaveError('Speichern fehlgeschlagen');
      }
    }
  };

  const getFieldError = (fieldName) => {
    const error = fieldErrors[fieldName];
    if (!error) return null;
    return Array.isArray(error) ? error[0] : error;
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? t('benutzer.editTitle') : t('benutzer.newTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saveError && <Alert variant="danger" className="mb-3">{saveError}</Alert>}
          <div className="row g-3">
            {/* Vorname */}
            <div className="col-6">
              <Form.Label>{t('kunden.firstName')} *</Form.Label>
              <Form.Control
                required
                isInvalid={!!fieldErrors.vorname}
                value={form.vorname}
                onChange={(e) => setForm({ ...form, vorname: e.target.value })}
              />
              {fieldErrors.vorname && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('vorname')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Nachname */}
            <div className="col-6">
              <Form.Label>{t('kunden.lastName')} *</Form.Label>
              <Form.Control
                required
                isInvalid={!!fieldErrors.nachname}
                value={form.nachname}
                onChange={(e) => setForm({ ...form, nachname: e.target.value })}
              />
              {fieldErrors.nachname && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('nachname')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Email */}
            <div className="col-md-6">
              <Form.Label>{t('auth.email')} *</Form.Label>
              <Form.Control
                required
                type="email"
                isInvalid={!!fieldErrors.email}
                value={form.email}
                disabled={isEdit}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('email')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Passwort (Only for New) */}
            {!isEdit && (
              <div className="col-md-6">
                <Form.Label>Passwort *</Form.Label>
                <Form.Control
                  required
                  type="password"
                  isInvalid={!!fieldErrors.passwort}
                  value={form.passwort}
                  onChange={(e) => setForm({ ...form, passwort: e.target.value })}
                  placeholder="min 8, A-z, 0-9, Sonderzeichen"
                />
                {fieldErrors.passwort && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {getFieldError('passwort')}
                  </Form.Control.Feedback>
                )}
              </div>
            )}

            {/* Rolle */}
            <div className="col-md-4">
              <Form.Label>{t('benutzer.role')}</Form.Label>
              <Form.Select
                isInvalid={!!fieldErrors.rolle}
                value={form.rolle}
                onChange={(e) => setForm({ ...form, role: e.target.value, rolle: e.target.value })}
              >
                {rollen.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Form.Select>
              {fieldErrors.rolle && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('rolle')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Rufnummer */}
            <div className="col-md-4">
              <Form.Label>Rufnummer</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.rufNummer}
                value={form.rufNummer}
                onChange={(e) => setForm({ ...form, rufNummer: e.target.value })}
              />
              {fieldErrors.rufNummer && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('rufNummer')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Abteilung */}
            <div className="col-md-4">
              <Form.Label>Abteilung</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.abteilung}
                value={form.abteilung}
                onChange={(e) => setForm({ ...form, abteilung: e.target.value })}
              />
              {fieldErrors.abteilung && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('abteilung')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Profilbild */}
            <div className="col-12">
              <Form.Label>Profilbild</Form.Label>
              <div>
                {form.bild && !bildFile && (
                  <div className="mb-2 d-flex align-items-center gap-2">
                    <img
                      src={imageUrl(form.bild)}
                      alt="Avatar"
                      style={{ width: 56, height: 56, borderRadius: '10%', objectFit: 'cover', border: '1px solid #ddd' }}
                    />
                    <Button variant="outline-danger" size="sm" className="rounded-2" onClick={handleBildDelete}>
                      <i className="bi bi-trash" />
                    </Button>
                  </div>
                )}
                <div className="d-flex gap-2 align-items-center">
                  <Form.Control
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    ref={fileInputRef}
                    onChange={handleBildFileSelect}
                  />
                  {bildFile && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="rounded-2" 
                      onClick={handleBildRemoveSelection}
                      title="Seçimi kaldır"
                    >
                      <i className="bi bi-x-lg" />
                    </Button>
                  )}
                </div>
                {bildFile && (
                  <small className="text-success d-block mt-1">
                    <i className="bi bi-check-circle-fill me-1" />
                    {bildFile.name} seçildi. Kaydet butonuna bastığınızda yüklenecek.
                  </small>
                )}
                {bildError && <small className="text-danger d-block mt-1">{bildError}</small>}
                {!initial?.id && !bildFile && (
                  <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1" />
                    Avatar seçebilirsiniz. Kaydet butonuna bastığınızda tüm bilgilerle birlikte yüklenecektir.
                  </small>
                )}
              </div>
            </div>

            {/* Hinweise */}
            <div className="col-12">
              <Form.Label>Hinweise</Form.Label>
              <Form.Control as="textarea" rows={2}
                isInvalid={!!fieldErrors.hinweise}
                value={form.hinweise}
                onChange={(e) => setForm({ ...form, hinweise: e.target.value })}
              />
              {fieldErrors.hinweise && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('hinweise')}
                </Form.Control.Feedback>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="rounded-2" onClick={onHide} disabled={saving}>{t('common.cancel')}</Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="rounded-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Speichern...
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
