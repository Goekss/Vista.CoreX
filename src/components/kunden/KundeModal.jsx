import { useEffect, useState, useRef } from 'react';
import { Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { useLanguage } from '../../hooks/useLanguage';
import { kundeApi } from '../../api/kundeApi';
import { ApiError } from '../../api/errorHandler';
import { API_ORIGIN } from '../../api/axiosClient';

const STORAGE_URL = API_ORIGIN;
const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${STORAGE_URL}${path}`;
};

export default function KundeModal({ show, onHide, onSave, onRefresh, initial, error }) {
  const { t } = useLanguage();

  // ---------- STATE MANAGEMENT ----------
  const [form, setForm] = useState({
    unternehmen: '', vorname: '', nachname: '', email: '',
    telefonMobil: '', telefonHaus: '', adresse: '', website: '', logo: '', hinweise: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef(null);

  // ---------- EFFECTS ----------
  useEffect(() => {
    if (initial) {
      setForm({
        unternehmen: initial.unternehmen || '',
        vorname: initial.vorname || '',
        nachname: initial.nachname || '',
        email: initial.email || '',
        telefonMobil: initial.telefonMobil || '',
        telefonHaus: initial.telefonHaus || '',
        adresse: initial.adresse || '',
        website: initial.website || '',
        logo: initial.logo || '',
        hinweise: initial.hinweise || '',
      });
    } else {
      setForm({
        unternehmen: '', vorname: '', nachname: '', email: '',
        telefonMobil: '', telefonHaus: '', adresse: '', website: '', logo: '', hinweise: ''
      });
    }
    setFieldErrors({});
    setLogoFile(null);
    setLogoError('');
    setSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [initial, show]);

  // ---------- HANDLERS: LOGO UPLOAD ----------
  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setLogoError('Sadece PNG, JPEG, JPG formatları desteklenir');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Dosya boyutu 5MB den küçük olmalı');
      return;
    }
    setLogoError('');
    setLogoFile(file);
  };

  const handleLogoDelete = async () => {
    if (!initial?.id) return;
    setLogoError('');
    try {
      await kundeApi.deleteLogo(initial.id);
      setForm((f) => ({ ...f, logo: '' }));
      if (onRefresh) await onRefresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setLogoError(err.message);
      } else {
        setLogoError('Logo silinirken hata oluştu');
      }
    }
  };

  const handleLogoRemoveSelection = () => {
    setLogoFile(null);
    setLogoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- HANDLERS: FORM SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setLogoError('');

    const { logo: _logo, ...rest } = form;
    const payload = {};

    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[key] = trimmed;
      } else {
        payload[key] = value ?? '';
      }
    });

    try {
      const response = await onSave(payload);

      if (logoFile) {
        const customerId = initial?.id || response?.data?.id;

        if (customerId) {
          try {
            await kundeApi.uploadLogo(customerId, logoFile);
          } catch (logoErr) {
            if (logoErr instanceof ApiError) {
              setLogoError(`Müşteri kaydedildi ancak logo yüklenemedi: ${logoErr.message}`);
            } else {
              setLogoError('Müşteri kaydedildi ancak logo yüklenemedi');
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
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        }
      }
      throw err;
    }
  };

  const getFieldError = (fieldName) => {
    const error = fieldErrors[fieldName];
    if (!error) return null;
    return Array.isArray(error) ? error[0] : error;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? t('kunden.editTitle') : t('kunden.newTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="row g-3">
            {/* Unternehmen */}
            <div className="col-md-6">
              <Form.Label>{t('kunden.company')} *</Form.Label>
              <Form.Control
                required
                isInvalid={!!fieldErrors.unternehmen}
                value={form.unternehmen}
                onChange={(e) => setForm({ ...form, unternehmen: e.target.value })}
              />
              {fieldErrors.unternehmen && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('unternehmen')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Email */}
            <div className="col-md-6">
              <Form.Label>{t('auth.email')} *</Form.Label>
              <Form.Control
                type="email"
                required
                isInvalid={!!fieldErrors.email}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('email')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Vorname */}
            <div className="col-md-6">
              <Form.Label>{t('kunden.firstName')}</Form.Label>
              <Form.Control
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
            <div className="col-md-6">
              <Form.Label>{t('kunden.lastName')}</Form.Label>
              <Form.Control
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

            {/* Telefon Mobil */}
            <div className="col-md-6">
              <Form.Label>{t('kunden.mobilePhone')}</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.telefonMobil}
                value={form.telefonMobil}
                onChange={(e) => setForm({ ...form, telefonMobil: e.target.value })}
              />
              {fieldErrors.telefonMobil && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('telefonMobil')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Telefon Haus */}
            <div className="col-md-6">
              <Form.Label>{t('kunden.homePhone')}</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.telefonHaus}
                value={form.telefonHaus}
                onChange={(e) => setForm({ ...form, telefonHaus: e.target.value })}
              />
              {fieldErrors.telefonHaus && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('telefonHaus')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Adresse */}
            <div className="col-12">
              <Form.Label>{t('kunden.address')}</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.adresse}
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
              {fieldErrors.adresse && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('adresse')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Website */}
            <div className="col-md-6">
              <Form.Label>{t('kunden.website')}</Form.Label>
              <Form.Control
                isInvalid={!!fieldErrors.website}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              {fieldErrors.website && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {getFieldError('website')}
                </Form.Control.Feedback>
              )}
            </div>

            {/* Logo */}
            <div className="col-12">
              <Form.Label>Logo</Form.Label>
              <div>
                {form.logo && !logoFile && (
                  <div className="mb-2 d-flex align-items-center gap-2">
                    <img
                      src={imageUrl(form.logo)}
                      alt="Logo"
                      style={{ maxHeight: 56, maxWidth: 112, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }}
                    />
                    <Button variant="outline-danger" size="sm" className="rounded-2" onClick={handleLogoDelete}>
                      <i className="bi bi-trash" />
                    </Button>
                  </div>
                )}

                <div className="d-flex gap-2 align-items-center">
                  <Form.Control
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    ref={fileInputRef}
                    onChange={handleLogoFileSelect}
                  />
                  {logoFile && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="rounded-2"
                      onClick={handleLogoRemoveSelection}
                      title="Seçimi kaldır"
                    >
                      <i className="bi bi-x-lg" />
                    </Button>
                  )}
                </div>

                {logoFile && (
                  <small className="text-success d-block mt-1">
                    <i className="bi bi-check-circle-fill me-1" />
                    {logoFile.name} seçildi. Kaydet butonuna bastığınızda yüklenecek.
                  </small>
                )}

                {logoError && <small className="text-danger d-block mt-1">{logoError}</small>}

                {!initial?.id && !logoFile && (
                  <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1" />
                    Logo seçebilirsiniz. Kaydet butonuna bastığınızda tüm bilgilerle birlikte yüklenecektir.
                  </small>
                )}
              </div>
            </div>

            {/* Notlar */}
            <div className="col-12">
              <Form.Label>{t('kunden.notes')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
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
