import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createMedicalLog,
  getUserMedicalHistory,
  listUsers,
  updateDonorStatus,
} from "../services/api";

function DonorStatusPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [donorConsent, setDonorConsent] = useState(false);
  const [donorAvailability, setDonorAvailability] = useState("Unavailable");
  const [history, setHistory] = useState(null);
  const [hemoglobinInput, setHemoglobinInput] = useState("12.9");
  const [conditionsInput, setConditionsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logSaving, setLogSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const selectedUserIdRef = useRef("");

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId),
    [users, selectedUserId]
  );

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const fetchUsers = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const data = await listUsers({ limit: 60, page: targetPage });
      const items = data?.items || [];
      const pageInfo = data?.pagination || null;
      const activeUserId = selectedUserIdRef.current;

      setUsers(items);
      setPagination(pageInfo);
      setPage(pageInfo?.page || targetPage);

      if (activeUserId) {
        const matched = items.find((item) => item._id === activeUserId);
        if (matched) {
          setDonorConsent(Boolean(matched.donorConsent));
          setDonorAvailability(matched.donorAvailability || "Unavailable");
          return;
        }
      }

      if (items.length > 0) {
        const first = items[0];
        setSelectedUserId(first._id);
        setDonorConsent(Boolean(first.donorConsent));
        setDonorAvailability(first.donorAvailability || "Unavailable");
      } else {
        setSelectedUserId("");
        setDonorConsent(false);
        setDonorAvailability("Unavailable");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load donors.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (userId) => {
    if (!userId) {
      setHistory(null);
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await getUserMedicalHistory(userId, 20);
      setHistory(data);
    } catch (err) {
      setHistory(null);
      setError(err?.response?.data?.message || "Unable to load medical history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    fetchHistory(selectedUserId);
  }, [fetchHistory, selectedUserId]);

  const selectUser = (user) => {
    setSelectedUserId(user._id);
    setDonorConsent(!!user.donorConsent);
    setDonorAvailability(user.donorAvailability || "Unavailable");
    setStatusMessage("");
    setError("");
  };

  const saveStatus = async () => {
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
      await fetchUsers(page);
      await fetchHistory(selectedUserId);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update donor status.");
    } finally {
      setSaving(false);
    }
  };

  const addMedicalLog = async () => {
    if (!selectedUserId) {
      setError("Select a donor before adding logs.");
      return;
    }

    const hemoglobin = Number(hemoglobinInput);
    if (!Number.isFinite(hemoglobin)) {
      setError("Hemoglobin must be a valid number.");
      return;
    }

    const chronicConditions = conditionsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setLogSaving(true);
      setError("");
      setStatusMessage("");
      await createMedicalLog({
        userId: selectedUserId,
        hemoglobin,
        chronicConditions,
      });
      setStatusMessage("Medical log added.");
      await fetchUsers(page);
      await fetchHistory(selectedUserId);
      setConditionsInput("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to add medical log.");
    } finally {
      setLogSaving(false);
    }
  };

  const goToPage = async (targetPage) => {
    if (!pagination) return;
    if (targetPage < 1 || targetPage > pagination.totalPages) return;
    await fetchUsers(targetPage);
  };

  return (
    <section className="rounded-3xl border border-sand/70 bg-white/85 p-5 shadow-panel md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-slate">Consent & Medical Logs</h3>
        <button
          type="button"
          onClick={() => fetchUsers(page)}
          disabled={loading}
          className="rounded-lg border border-pine/20 px-3 py-1 text-xs font-semibold text-pine transition hover:bg-pine/10 disabled:opacity-70"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate/70">
        Manage donor consent and maintain longitudinal hemoglobin/chronic-condition logs.
      </p>
      <p className="mt-1 text-xs font-semibold text-slate/60">
        Showing {users.length} donors on page {pagination?.page || 1} of{" "}
        {pagination?.totalPages || 1} (Total: {pagination?.total || users.length})
      </p>

      <div className="mt-4 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={loading || !pagination?.hasPrev}
          className="rounded-lg border border-amber-200 bg-cream px-3 py-1 text-xs font-semibold text-slate transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-xs text-slate/70">
          Page {pagination?.page || 1} / {pagination?.totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={loading || !pagination?.hasNext}
          className="rounded-lg border border-amber-200 bg-cream px-3 py-1 text-xs font-semibold text-slate transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-100 bg-cream p-4">
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
            onClick={saveStatus}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-pine px-4 py-2 text-sm font-bold uppercase tracking-wide text-sand transition hover:bg-pine/90 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Update Donor Status"}
          </button>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-cream p-4">
          <h4 className="font-heading text-base font-semibold text-slate">Add Medical Log</h4>
          <p className="mt-1 text-xs text-slate/70">
            Comma-separate chronic conditions (example: asthma, thyroid).
          </p>

          <label className="mt-3 block text-xs font-semibold text-slate/80">
            Hemoglobin (g/dL)
            <input
              type="number"
              step="0.1"
              value={hemoglobinInput}
              onChange={(e) => setHemoglobinInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-pine"
            />
          </label>

          <label className="mt-3 block text-xs font-semibold text-slate/80">
            Chronic Conditions
            <input
              type="text"
              value={conditionsInput}
              onChange={(e) => setConditionsInput(e.target.value)}
              placeholder="asthma, thyroid"
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-pine"
            />
          </label>

          <button
            type="button"
            onClick={addMedicalLog}
            disabled={logSaving}
            className="mt-4 w-full rounded-xl bg-ember px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-ember/90 disabled:opacity-70"
          >
            {logSaving ? "Adding..." : "Add Medical Log"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-heading text-base font-semibold text-slate">Medical History</h4>
          {historyLoading ? <span className="text-xs text-slate/60">Loading...</span> : null}
        </div>

        {history ? (
          <>
            <p className="mt-1 text-xs text-slate/70">
              Logs: {history.summary.totalLogs} | Eligible snapshots: {history.summary.eligibleLogs} |
              Avg Hb: {history.summary.averageHemoglobin}
            </p>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {history.logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-xl border border-sand/80 bg-cream/50 px-3 py-2 text-xs text-slate/80"
                >
                  <p className="font-semibold text-slate">
                    Hb {log.hemoglobin} g/dL | {log.donorEligible ? "Eligible" : "Not Eligible"}
                  </p>
                  <p>
                    Conditions: {log.chronicConditionCount} | Disqualifying:{" "}
                    {log.hasDisqualifyingCondition ? "Yes" : "No"}
                  </p>
                  <p>{new Date(log.recordedAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate/70">
            Select a donor to view medical logs.
          </p>
        )}
      </div>

      {statusMessage ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {statusMessage}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
    </section>
  );
}

export default DonorStatusPanel;
