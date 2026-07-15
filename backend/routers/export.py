from datetime import date
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io
from ..services.export_service import generate_expense_report_image

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/report")
async def export_report(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    categories: Optional[str] = Query("all", description="Comma-separated or 'all'"),
    preset: Optional[str] = Query(None, description="this_month|last_month|this_week|custom"),
):
    image_bytes = await generate_expense_report_image(
        start_date=start_date,
        end_date=end_date,
        categories=categories,
        preset=preset,
    )

    # Build filename
    today_str = date.today().strftime("%Y%m%d")
    if preset and preset != "custom":
        filename = f"expense_report_{preset}_{today_str}.png"
    elif start_date and end_date:
        filename = f"expense_report_{start_date}_to_{end_date}.png"
    else:
        filename = f"expense_report_{today_str}.png"

    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
