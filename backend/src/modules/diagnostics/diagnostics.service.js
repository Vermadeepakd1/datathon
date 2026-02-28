const axios = require("axios");
const env = require("../../config/env");
const DiagnosticEvent = require("./diagnosticEvent.model");
const { computeHeuristicRisk } = require("../../utils/riskHeuristics");

const mapPayloadForModel = (payload) => ({
  age: payload.age,
  systolic_bp: payload.systolicBP,
  diastolic_bp: payload.diastolicBP,
  blood_glucose: payload.bloodGlucose,
  body_temp: payload.bodyTemp,
  heart_rate: payload.heartRate,
});

const requestModelPrediction = async (payload) => {
  const modelPayload = mapPayloadForModel(payload);
  const response = await axios.post(`${env.mlServiceUrl}/predict`, modelPayload, {
    timeout: 4000,
  });
  return response.data;
};

const normalizeModelOutput = (modelOutput) => {
  const explainability = Array.isArray(modelOutput.feature_importance)
    ? modelOutput.feature_importance
    : [];

  const topFeature = explainability.sort((a, b) => b.importance - a.importance)[0];

  return {
    riskLevel: modelOutput.risk_level || "medium",
    riskScore: Number(modelOutput.risk_score ?? 50),
    primaryRiskDriver: topFeature?.feature || "unknown",
    explainability,
    source: "ml_model",
  };
};

const evaluateDiagnosticInput = async (payload) => {
  let output;

  try {
    const modelOutput = await requestModelPrediction(payload);
    output = normalizeModelOutput(modelOutput);
  } catch (_error) {
    output = computeHeuristicRisk(payload);
  }

  const event = await DiagnosticEvent.create({
    inputs: {
      age: payload.age,
      systolicBP: payload.systolicBP,
      diastolicBP: payload.diastolicBP,
      bloodGlucose: payload.bloodGlucose,
      bodyTemp: payload.bodyTemp,
      heartRate: payload.heartRate,
      patientBloodGroup: payload.patientBloodGroup,
    },
    output,
    metadata: {
      facilityCode: payload.facilityCode || "",
      submittedAt: new Date(),
    },
  });

  return {
    eventId: event._id,
    ...output,
  };
};

module.exports = { evaluateDiagnosticInput };
