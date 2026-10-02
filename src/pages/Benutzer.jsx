import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';
import DataTable from '../components/shared/DataTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LockedUsersPanel from '../components/benutzer/LockedUsersPanel';
import BenutzerModal from '../components/benutzer/BenutzerModal';
import BenutzerViewModal from '../components/benutzer/BenutzerViewModal';
import { benutzerApi } from '../api/benutzerApi';
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

export default function Benutzer() {
  const { t } = useLanguage();
  const { canManageUsers } = usePermission();

  // ---------- STATE MANAGEMENT ----------
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const size = 20;

  // ---------- EFFECTS & CALLBACKS ----------
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await benutzerApi.getAll(page, size, search);
      setUsers(res.data.items || res.data || []);
      setTotal(res.data.totalCount || 0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('benutzer.loadError'));
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- HANDLERS: SAVE, DELETE ----------
  const handleSave = async (payload) => {
    setError('');
    try {
      let response;
      if (editItem) {
        response = await benutzerApi.update(editItem.id, payload);
      } else {
        response = await benutzerApi.create(payload);
      }
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('benutzer.saveError'));
      }
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await benutzerApi.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getLocalizedMessage(t));
      } else {
        setError(t('benutzer.deleteError'));
      }
    }
  };

  // ---------- TABLE COLUMNS DEFINITION ----------
  const columns = [
    {
      key: 'bild',
      label: 'Bild',
      render: (row) => row.bild ? (
        <img
          src={imageUrl(row.bild)}
          alt=""
          style={{ width: 46, height: 46, borderRadius: '30%', objectFit: 'cover', border: '1px solid #ddd' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
        />
      ) : (
        <span className="bi bi-person-circle fs-4 text-secondary" />
      ),
    },
    { key: 'vorname', label: t('kunden.firstName') },
    { key: 'nachname', label: t('kunden.lastName') },
    { key: 'email', label: t('auth.email') },
    { key: 'rolle', label: t('benutzer.role') },
    { key: 'abteilung', label: t('benutzer.abteilung') },
    { key: 'rufNummer', label: t('benutzer.rufNummer') },
    {
      key: 'actions',
      label: t('common.actions'),
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center align-items-center">
          <Button
            className="border-0 bg-transparent"
            size="xl"
            variant="outline-info"
            onClick={() => {
              setViewItem(row);
              setShowViewModal(true);
            }}
          >
            <i className="bi bi-eye" />
          </Button>
          {canManageUsers && (
            <>
              <Button
                className="border-0 bg-transparent"
                size="xl"
                variant="outline-primary"
                onClick={() => {
                  setEditItem(row);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-pencil-square" />
              </Button>
              <Button
                className="border-0 bg-transparent"
                size="xl"
                variant="outline-danger"
                onClick={() => setDeleteId(row.id)}
              >
                <i className="bi bi-trash" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Container fluid className="py-4">
      {/* Header: Title + New Button */}
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-5">Personal</h2>
        <div className="d-flex gap-2">
          {canManageUsers && (
            <Button
              variant={showLocked ? 'warning' : 'outline-warning'}
              className="rounded-3"
              onClick={() => setShowLocked(!showLocked)}
            >
              <i className="bi bi-lock-fill me-1" />
              {showLocked ? 'Zurück' : 'Gesperrte'}
            </Button>
          )}
          <Button
            className="rounded-3 bg-outline-primary"
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ display: canManageUsers ? 'inline-flex' : 'none' }}
          >
            <i className="bi bi-plus-lg me-1" /> {t('benutzer.new')}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="w-25 text-center justify-content-center mx-auto" variant="danger">
          <i className="bi bi-exclamation-triangle-fill me-2" /> {error}
        </Alert>
      )}

      {/* Content: Locked Users or Table */}
      {showLocked ? (
        <LockedUsersPanel />
      ) : loading ? (
        <LoadingSpinner text={t('benutzer.loading')} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          totalCount={total}
          size={size}
          page={page}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder={t('benutzer.search')}
        />
      )}

      {/* Modals */}
      <BenutzerModal
        show={showModal}
        initial={editItem}
        onHide={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        onRefresh={load}
      />

      <BenutzerViewModal
        show={showViewModal}
        item={viewItem}
        onHide={() => {
          setShowViewModal(false);
          setViewItem(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        show={!!deleteId}
        title={t('benutzer.deleteTitle')}
        message={t('benutzer.deleteMessage')}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Container>
  );
}