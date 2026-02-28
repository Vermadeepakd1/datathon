const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const asPercentDeviation = (value, low, high) => {
  if (value < low) return ((low - value) / low) * 100;
  if (value > high) return ((value - high) / high) * 100;
  return 0;
};

const computeHeuristicRisk = (payload) => {
  const features = {
    age: { value: payload.age, low: 18, high: 40 },
    systolicBP: { value: payload.systolicBP, low: 90, high: 140 },
    diastolicBP: { value: payload.diastolicBP, low: 60, high: 90 },
    bloodGlucose: { value: payload.bloodGlucose, low: 70, high: 140 },
    bodyTemp: { value: payload.bodyTemp, low: 97, high: 100.4 },
    heartRate: { value: payload.heartRate, low: 60, high: 110 },
  };

  const deviations = Object.entries(features).map(([key, config]) => ({
    feature: key,
    deviation: asPercentDeviation(config.value, config.low, config.high),
  }));

  const totalDeviation = deviations.reduce((sum, item) => sum + item.deviation, 0);
  const riskScore = clamp(Math.round(totalDeviation * 1.5), 0, 100);

  let riskLevel = "low";
  if (riskScore >= 70) riskLevel = "high";
  else if (riskScore >= 35) riskLevel = "medium";

  const primaryRiskDriver = deviations.sort((a, b) => b.deviation - a.deviation)[0];

  return {
    riskLevel,
    riskScore,
    primaryRiskDriver: primaryRiskDriver.feature,
    explainability: deviations.map((item) => ({
      feature: item.feature,
      importance: Number((item.deviation / 100).toFixed(4)),
    })),
    source: "heuristic_fallback",
  };
};

module.exports = { computeHeuristicRisk };
