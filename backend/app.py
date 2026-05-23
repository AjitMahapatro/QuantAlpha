from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas.responses import SnapshotResponse
from backend.services.platform_service import build_platform_snapshot

app = FastAPI(title="QuantAlpha Quantitative Analytics API")
logger = logging.getLogger("quantalpha.api")
logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "QuantAlpha quantitative analytics backend running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/snapshot", response_model=SnapshotResponse)
def snapshot(
    tickers: str | None = Query(default=None, description="Comma-separated tickers"),
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
) -> dict[str, object]:
    try:
        parsed = [ticker.strip().upper() for ticker in tickers.split(",")] if tickers else None
        return build_platform_snapshot(parsed, start_date, end_date)
    except Exception as exc:  # pragma: no cover - endpoint safety
        logger.exception("Snapshot generation failed")
        raise HTTPException(status_code=503, detail=f"Analytics snapshot failed: {exc}") from exc
