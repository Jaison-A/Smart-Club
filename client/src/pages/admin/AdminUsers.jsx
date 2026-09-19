import { useEffect, useState, useCallback } from 'react';
import { Search, UserCog, Ban, RotateCcw } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin.api';

const ROLES = ['student', 'coordinator', 'admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        limit: 50,
      });
      setUsers(data.data.users);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleRoleChange(id, role) {
    setActioningId(id);
    try {
      await adminApi.setRole(id, role);
      await load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleToggleActive(id, isActive) {
    setActioningId(id);
    try {
      await (isActive ? adminApi.disableUser(id) : adminApi.enableUser(id));
      await load();
    } finally {
      setActioningId(null);
    }
  }

  return (
    <>
      <TopBar title="Users" subtitle="Manage students, coordinators, and admins." />

      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState icon={UserCog} title="No users found" />
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === (currentUser.id || currentUser._id);
                  return (
                    <tr key={u._id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">
                        {u.name} {isSelf && <span className="text-xs text-ink-muted">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || actioningId === u._id}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-md border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'active' : 'disabled'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === u._id}
                            onClick={() => handleToggleActive(u._id, u.isActive)}
                          >
                            {u.isActive ? (
                              <>
                                <Ban size={13} /> Disable
                              </>
                            ) : (
                              <>
                                <RotateCcw size={13} /> Enable
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
