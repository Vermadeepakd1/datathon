import { useState } from "react";

function SosAlertPanel({ onTrigger, loading, latestBloodGroup }) {
  const [radiusKm, setRadiusKm] = useState(25);
  const [longitude, setLongitude] = useState(-73.935242);
  const [latitude, setLatitude] = useState(40.73061);

  const submit = async () => {
    await onTrigger({
      patientBloodGroup: latestBloodGroup || "O+",
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
      radiusKm: Number(radiusKm),
      patientRiskLevel: "high",
      notes: "Emergency hemorrhage trigger",
    });
  };

  return (
    <section className="rounded-3xl border border-red-300/70 bg-red-50/80 p-5 shadow-panel md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-red-900">Hemorrhage Alert</h3>
        <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-900">
          One-Tap SOS
        </span>
      </div>

      <p className="mt-2 text-sm text-red-900/80">
        Bypass standard flow and immediately search for compatible ready-to-donate donors.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-red-900/80">
          Radius (km)
          <input
            type="number"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-red-400"
          />
        </label>
        <label className="text-xs font-semibold text-red-900/80">
          Longitude
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-red-400"
          />
        </label>
        <label className="text-xs font-semibold text-red-900/80">
          Latitude
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate outline-none focus:border-red-400"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-4 w-full animate-pulseAlert rounded-xl bg-red-600 px-4 py-3 font-heading text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-700 disabled:animate-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Triggering..." : "Activate Hemorrhage SOS"}
      </button>
    </section>
  );
}

export default SosAlertPanel;
