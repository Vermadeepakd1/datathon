const levelStyles = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

function RiskResultCard({ result }) {
  if (!result) {
    return (
      <section className="rounded-3xl border border-dashed border-sand/70 bg-white/60 p-6">
        <h3 className="font-heading text-lg font-semibold text-slate">ML Risk Output</h3>
        <p className="mt-2 text-sm text-slate/70">
          Submit vitals to view risk class, score, and primary risk driver.
        </p>
      </section>
    );
  }

  const topDrivers = (result.explainability || []).slice(0, 4);
  const level = String(result.riskLevel || "medium").toLowerCase();

  return (
    <section className="animate-fadeUp rounded-3xl border border-sand/70 bg-white p-6 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-slate">ML Risk Output</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyles[level]}`}>
          {level} risk
        </span>
      </div>

      <p className="mt-3 text-sm text-slate/75">
        Risk score: <strong>{result.riskScore}</strong> / 100
      </p>
      <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
        Primary risk driver: {result.primaryRiskDriver}
      </p>

      <div className="mt-4 space-y-2">
        {topDrivers.map((item) => (
          <div key={item.feature}>
            <div className="mb-1 flex justify-between text-xs text-slate/70">
              <span>{item.feature}</span>
              <span>{Math.round(item.importance * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-sand/70">
              <div
                className="h-full rounded-full bg-pine"
                style={{ width: `${Math.max(item.importance * 100, 5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RiskResultCard;
