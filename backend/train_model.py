from __future__ import annotations

import json

from backend.config import END_DATE, START_DATE, TICKERS
from backend.services.platform_service import build_platform_snapshot


if __name__ == "__main__":
    snapshot = build_platform_snapshot(TICKERS, START_DATE, END_DATE)
    model_summary = snapshot["ml_forecasting"]
    print(json.dumps(model_summary["metrics"], indent=2))
