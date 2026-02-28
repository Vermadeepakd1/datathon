import { useState } from "react";
import DiagnosticForm from "./components/DiagnosticForm";
import RiskResultCard from "./components/RiskResultCard";
import SosAlertPanel from "./components/SosAlertPanel";
import { evaluateDiagnosticInput, triggerHemorrhageAlert } from "./services/api";

function App() {
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [lastPatientBloodGroup, setLastPatientBloodGroup] = useState("O+");
  const [alertResult, setAlertResult] = useState(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [error, setError] = useState("");

  const handleDiagnosticSubmit = async (payload) => {
    try {
      setLoadingDiagnostic(true);
      setError("");
      const result = await evaluateDiagnosticInput(payload);
      setDiagnosticResult(result);
      setLastPatientBloodGroup(payload.patientBloodGroup);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to evaluate diagnostics right now.");
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  const handleAlertTrigger = async (payload) => {
    try {
      setLoadingAlert(true);
      setError("");
      const result = await triggerHemorrhageAlert(payload);
      setAlertResult(result);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to trigger hemorrhage alert.");
    } finally {
      setLoadingAlert(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#F7DAB8_0%,#F3EEE5_35%,#D6E6E8_100%)] px-4 py-6 font-body md:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="animate-fadeUp rounded-3xl bg-pine p-6 text-sand shadow-panel md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sand/80">Datathon Build</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
            Maternal-Guard & Life-Link
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-sand/85">
            Predict maternal risk from vitals and activate emergency donor discovery in seconds.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <DiagnosticForm onSubmit={handleDiagnosticSubmit} loading={loadingDiagnostic} />
          <RiskResultCard result={diagnosticResult} />
        </section>

        <SosAlertPanel
          onTrigger={handleAlertTrigger}
          loading={loadingAlert}
          latestBloodGroup={lastPatientBloodGroup}
        />

        <section className="rounded-3xl border border-sand/80 bg-white/80 p-5 shadow-panel md:p-6">
          <h3 className="font-heading text-lg font-semibold text-slate">Nearest Compatible Donors</h3>
          {!alertResult ? (
            <p className="mt-2 text-sm text-slate/70">
              Trigger SOS to list masked ready-to-donate candidates.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alertResult.candidates.map((candidate) => (
                <article
                  key={candidate.anonDonorId}
                  className="rounded-2xl border border-amber-100 bg-cream p-4 text-sm"
                >
                  <p className="font-semibold text-slate">{candidate.maskedAlias}</p>
                  <p className="mt-1 text-slate/70">Donor ID: {candidate.anonDonorId}</p>
                  <p className="text-slate/70">Blood: {candidate.bloodGroup}</p>
                  <p className="text-slate/70">Distance: {candidate.distanceKm} km</p>
                  <p className="font-semibold text-pine">Health score: {candidate.healthScore}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
