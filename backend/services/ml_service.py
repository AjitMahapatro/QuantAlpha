from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from xgboost import DMatrix, XGBClassifier

from backend.config import FEATURE_COLUMNS, MODELS_DIR


def _model_path(ticker: str) -> Path:
    return MODELS_DIR / f"{ticker.lower()}_direction_xgb.pkl"


def train_direction_model(feature_frame: pd.DataFrame, ticker: str) -> dict[str, object]:
    dataset = feature_frame.dropna(subset=FEATURE_COLUMNS + ["target_direction"]).copy()
    if len(dataset) < 150:
        raise RuntimeError("Not enough observations to train the forecasting model")

    split_index = int(len(dataset) * 0.8)
    train = dataset.iloc[:split_index]
    test = dataset.iloc[split_index:]

    X_train = train[FEATURE_COLUMNS]
    y_train = train["target_direction"].astype(int)
    X_test = test[FEATURE_COLUMNS]
    y_test = test["target_direction"].astype(int)

    model = XGBClassifier(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train)
    joblib.dump(model, _model_path(ticker))

    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
    booster = model.get_booster()

    latest_features = dataset.iloc[[-1]][FEATURE_COLUMNS]
    contributions = booster.predict(DMatrix(latest_features), pred_contribs=True)[0]
    shap_rows = []
    for feature_name, value in zip(FEATURE_COLUMNS + ["bias"], contributions):
        shap_rows.append({"feature": feature_name, "contribution": float(value)})

    feature_importance = sorted(
        [
            {"feature": feature, "importance": float(score)}
            for feature, score in zip(FEATURE_COLUMNS, model.feature_importances_.tolist())
        ],
        key=lambda row: row["importance"],
        reverse=True,
    )

    latest_probability = float(model.predict_proba(latest_features)[0, 1])
    artifact = {
        "ticker": ticker,
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "metrics": {
            "accuracy": float(accuracy_score(y_test, predictions)),
            "precision": float(precision_score(y_test, predictions, zero_division=0)),
            "recall": float(recall_score(y_test, predictions, zero_division=0)),
            "f1": float(f1_score(y_test, predictions, zero_division=0)),
        },
        "confusion_matrix": matrix.tolist(),
        "feature_importance": feature_importance,
        "shap_values": shap_rows,
        "prediction": {
            "date": str(dataset.index[-1].date()),
            "probability_up": latest_probability,
            "predicted_class": int(latest_probability >= 0.5),
            "confidence": float(abs(latest_probability - 0.5) * 2),
        },
        "test_actuals": y_test.astype(int).tolist(),
        "test_probabilities": probabilities.round(6).tolist(),
        "test_dates": test.index.strftime("%Y-%m-%d").tolist(),
    }

    report_path = MODELS_DIR / f"{ticker.lower()}_direction_xgb_metrics.json"
    report_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact
