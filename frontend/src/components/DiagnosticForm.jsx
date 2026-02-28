import { useMemo, useState } from "react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const defaultValues = {
  age: "27",
  systolicBP: "138",
  diastolicBP: "88",
  bloodGlucose: "128",
  bodyTemp: "99.2",
  heartRate: "96",
  patientBloodGroup: "O+",
};

const ranges = {
  age: [10, 55],
  systolicBP: [70, 250],
  diastolicBP: [40, 160],
  bloodGlucose: [40, 450],
  bodyTemp: [90, 110],
  heartRate: [30, 220],
};

const labelMap = {
  age: "Age",
  systolicBP: "Systolic BP",
  diastolicBP: "Diastolic BP",
  bloodGlucose: "Blood Glucose",
  bodyTemp: "Body Temp (F)",
  heartRate: "Heart Rate",
};

function DiagnosticForm({ onSubmit, loading }) {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});

  const fields = useMemo(
    () => ["age", "systolicBP", "diastolicBP", "bloodGlucose", "bodyTemp", "heartRate"],
    []
  );

  const validate = () => {
    const nextErrors = {};
    fields.forEach((field) => {
      const numeric = Number(values[field]);
      const [min, max] = ranges[field];
      if (!Number.isFinite(numeric)) {
        nextErrors[field] = `${labelMap[field]} must be a number`;
      } else if (numeric < min || numeric > max) {
        nextErrors[field] = `${labelMap[field]} must be between ${min} and ${max}`;
      }
    });

    if (!BLOOD_GROUPS.includes(values.patientBloodGroup)) {
      nextErrors.patientBloodGroup = "Select a valid blood group";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      age: Number(values.age),
      systolicBP: Number(values.systolicBP),
      diastolicBP: Number(values.diastolicBP),
      bloodGlucose: Number(values.bloodGlucose),
      bodyTemp: Number(values.bodyTemp),
      heartRate: Number(values.heartRate),
      patientBloodGroup: values.patientBloodGroup,
      facilityCode: "HW-MOBILE-01",
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-amber-100 bg-cream/90 p-5 shadow-panel backdrop-blur md:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-slate">Diagnostic Input</h2>
        <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold text-pine">
          Real-time validated
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="space-y-1">
            <span className="text-xs font-semibold text-slate/80">{labelMap[field]}</span>
            <input
              type="number"
              step="0.1"
              value={values[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate outline-none ring-0 transition focus:border-pine"
              placeholder={labelMap[field]}
            />
            {errors[field] ? <p className="text-xs text-ember">{errors[field]}</p> : null}
          </label>
        ))}

        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-semibold text-slate/80">Patient Blood Group</span>
          <select
            value={values.patientBloodGroup}
            onChange={(e) => handleChange("patientBloodGroup", e.target.value)}
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate outline-none transition focus:border-pine"
          >
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          {errors.patientBloodGroup ? (
            <p className="text-xs text-ember">{errors.patientBloodGroup}</p>
          ) : null}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-pine px-4 py-3 font-heading text-sm font-bold uppercase tracking-wide text-sand transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Evaluating..." : "Run Risk Prediction"}
      </button>
    </form>
  );
}

export default DiagnosticForm;
