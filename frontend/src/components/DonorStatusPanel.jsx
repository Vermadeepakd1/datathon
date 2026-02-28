import { useEffect, useMemo, useState } from "react";
import { listUsers, updateDonorStatus } from "../services/api";

function DonorStatusPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [donorConsent, setDonorConsent] = useState(false);
  const [donorAvailability, setDonorAvailability] = useState("Unavailable");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId),
    [users, selectedUserId]
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listUsers(200);
      setUsers(data);
      if (!selectedUserId && data.length > 0) {
        const first = data[0];
        setSelectedUserId(first._id);
        setDonorConsent(first.donorConsent);
        setDonorAvailability(first.donorAvailability || "Unavailable");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load donors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectUser = (user) => {
    setSelectedUserId(user._id);
    setDonorConsent(!!user.donorConsent);
    setDonorAvailability(user.donorAvailability || "Unavailable");
    setStatusMessage("");
    setError("");
  };

  const save = async () => {
    if (!selectedUserId) {
      setError("Select a donor first.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setStatusMessage("");
      await updateDonorStatus(selectedUserId, {
        donorConsent,
        donorAvailability,
      });
      setStatusMessage("Donor status updated.");
      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update donor status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-sand/70 bg-white/85 p-5 shadow-panel md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-slate">Consent Management</h3>
        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="rounded-lg border border-pine/20 px-3 py-1 text-xs font-semibold text-pine transition hover:bg-pine/10 disabled:opacity-70"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate/70">
        Toggle donor consent and temporary availability without deleting profiles.
      </p>
      <p className="mt-1 text-xs font-semibold text-slate/60">
        Showing {users.length} donors
      </p>

      <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <button
            key={user._id}
            type="button"
            onClick={() => selectUser(user)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              selectedUserId === user._id
                ? "border-pine bg-pine/5"
                : "border-amber-100 bg-cream hover:border-amber-200"
            }`}
          >
            <p className="font-semibold text-slate">{user.name}</p>
            <p className="text-xs text-slate/70">{user.bloodGroup}</p>
            <p className="text-xs text-slate/70">
              {user.donorConsent ? "Consent: Yes" : "Consent: No"} | {user.donorAvailability}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-cream p-4">
        <p className="text-xs text-slate/70">Selected donor ID</p>
        <p className="break-all text-sm font-semibold text-slate">
          {selectedUser?._id || "No donor selected"}
        </p>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate">
          <input
            type="checkbox"
            checked={donorConsent}
            onChange={(e) => {
              setDonorConsent(e.target.checked);
              if (!e.target.checked) {
                setDonorAvailability("Unavailable");
              }
            }}
          />
          Donor Consent Enabled
        </label>

        <label className="mt-3 block text-xs font-semibold text-slate/80">
          Availability
          <select
            value={donorAvailability}
            disabled={!donorConsent}
            onChange={(e) => setDonorAvailability(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-pine disabled:bg-gray-100"
          >
            <option value="Ready-to-Donate">Ready-to-Donate</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </label>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-pine px-4 py-2 text-sm font-bold uppercase tracking-wide text-sand transition hover:bg-pine/90 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Update Donor Status"}
        </button>
      </div>

      {statusMessage ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {statusMessage}
        </p>
      ) : null}
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}

export default DonorStatusPanel;
