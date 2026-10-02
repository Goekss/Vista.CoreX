import { useEffect, useState, useCallback } from 'react';
import { Container, Button, Alert } from 'react-bootstrap';
import '../styles/Kunden.css';
import DataTable from '../components/shared/DataTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import KundeModal from '../components/kunden/KundeModal';
import AnsprechpartnerModal from '../components/kunden/AnsprechpartnerModal';
import KundeProjekteModal from '../components/kunden/KundeProjekteModal';
import { kundeApi } from '../api/kundeApi';
import { useLanguage } from '../hooks/useLanguage';
import { ApiError } from '../api/errorHandler';
import { usePermission } from '../hooks/usePermission';
import { API_ORIGIN } from '../api/axiosClient';

const STORAGE_URL = API_ORIGIN;
const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${STORAGE_URL}${path}`;
};

export default function Kunden() {
  const { t } = useLanguage();
  const { canEdit, canDelete, canCreate } = usePermission();

  // ---------- STATE MANAGEMENT ----------
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [ansprechpartnerKunde, setAnsprechpartnerKunde] = useState(null);
  const [projekteKunde, setProjekteKunde] = useState(null);
  const size = 20;

  // ---------- EFFECTS & CALLBACKS ----------
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await kundeApi.getAll(page, size, search);
      setData(res.data.items || res.data);
      setTotal(res.data.totalCount || 0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('kunden.loadError'));
      }
    }
    setLoading(false);
  }, [page, search, t]);

  useEffect(() => { load(); }, [load]);

  // ---------- HANDLERS: SAVE, DELETE ----------
  const handleSave = async (formData) => {
    setError('');
    try {
      let response;
      if (editItem) {
        response = await kundeApi.update(editItem.id, formData);
      } else {
        response = await kundeApi.create(formData);
      }
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('kunden.saveError'));
      }
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await kundeApi.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('kunden.deleteError'));
      }
    }
  };

  // ---------- TABLE COLUMNS DEFINITION ----------
  const columns = [
    {
      key: 'logo',
      label: 'Logo',
      render: (row) => row.logo ? (
        <img
          src={imageUrl(row.logo)}
          alt="Logo"
          style={{ maxHeight: 36, maxWidth: 72, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }}
        />
      ) : (
        <span className="bi bi-building text-secondary fs-5" />
      ),
    },
    { key: 'unternehmen', label: t('kunden.company') },
    { key: 'vorname', label: t('kunden.firstName') },
    { key: 'nachname', label: t('kunden.lastName') },
    { key: 'email', label: t('auth.email') },
    { key: 'telefonMobil', label: t('kunden.phone') },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (row) => (
        <div className="d-flex gap-1 justify-content-end">
          <button className="kunden-action-btn info" title="Ansprechpartner"
            onClick={() => setAnsprechpartnerKunde(row)}>
            <i className="bi bi-person-lines-fill" />
          </button>
          <button className="kunden-action-btn success" title="Projekte"
            onClick={() => setProjekteKunde(row)}>
            <i className="bi bi-folder2-open" />
          </button>
          {canEdit && (
            <button className="kunden-action-btn primary" title="Bearbeiten"
              onClick={() => { setEditItem(row); setShowModal(true); }}>
              <i className="bi bi-pencil" />
            </button>
          )}
          {canDelete && (
            <button className="kunden-action-btn danger" title="Löschen"
              onClick={() => setDeleteId(row.id)}>
              <i className="bi bi-trash3" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ---------- RENDER ----------
  return (
    <Container fluid className="py-4">
      {/* Header: Title + New Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{t('kunden.title')}</h2>
        {canCreate && (
          <Button className="rounded-2" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <i className="bi bi-plus-lg me-1" /> {t('kunden.new')}
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* === TABLE === */}
      {loading ? (
        <LoadingSpinner text={t('kunden.loading')} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          totalCount={total}
          page={page}
          size={size}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder={t('kunden.search')}
        />
      )}

      {/* === MODALS === */}
      <KundeModal
        show={showModal}
        onHide={() => { setShowModal(false); setEditItem(null); setError(''); }}
        onSave={handleSave}
        onRefresh={load}
        initial={editItem}
        error={error}
      />

      <ConfirmDialog
        show={!!deleteId}
        title={t('kunden.deleteTitle')}
        message={t('kunden.deleteMessage')}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      {ansprechpartnerKunde && (
        <AnsprechpartnerModal
          kunde={ansprechpartnerKunde}
          onHide={() => setAnsprechpartnerKunde(null)}
        />
      )}

      {projekteKunde && (
        <KundeProjekteModal
          kunde={projekteKunde}
          onHide={() => setProjekteKunde(null)}
        />
      )}
    </Container>
  );
}
