import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import LoadingSpinner from '../shared/LoadingSpinner';
import { authApi } from '../../api/authApi';

export default function LockedUsersPanel() {
  const [locked, setLocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.getLockedUsers();
      setLocked(res.data || []);
    } catch {
      setError('Gesperrte Benutzer konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnlock = async (email) => {
    setUnlocking(email);
    try {
      await authApi.unlockUser(email);
      await load();
    } catch {
      setError(`Entsperren fehlgeschlagen: ${email}`);
    } finally {
      setUnlocking(null);
    }
  };

  if (loading) return <LoadingSpinner text="Gesperrte Benutzer werden geladen..." />;

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      {locked.length === 0 ? (
        <Alert variant="success">
          <i className="bi bi-check-circle-fill me-2" />
          Keine gesperrten Benutzer vorhanden.
        </Alert>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Gesperrt seit</th>
                <th className="text-end">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {locked.map((u) => (
                <tr key={u.email || u.id}>
                  <td>{u.email}</td>
                  <td>{u.vorname} {u.nachname}</td>
                  <td>{u.lockoutEnd?.slice(0, 16) || '—'}</td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-success"
                      className="rounded-2"
                      disabled={unlocking === u.email}
                      onClick={() => handleUnlock(u.email)}
                    >
                      {unlocking === u.email ? (
                        <Spinner size="sm" />
                      ) : (
                        <><i className="bi bi-unlock me-1" />Entsperren</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
