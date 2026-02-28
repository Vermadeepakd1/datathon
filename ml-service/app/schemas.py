from pydantic import BaseModel, ConfigDict, Field


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: int = Field(..., ge=10, le=55)
    systolic_bp: float = Field(..., ge=70, le=250)
    diastolic_bp: float = Field(..., ge=40, le=160)
    blood_glucose: float = Field(..., ge=40, le=450)
    body_temp: float = Field(..., ge=90, le=110)
    heart_rate: float = Field(..., ge=30, le=220)


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class PredictResponse(BaseModel):
    risk_level: str
    risk_score: float
    predicted_class_index: int
    feature_importance: list[FeatureImportanceItem]
    model_version: str
