import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator


class InstalledAssetCreate(BaseModel):
    product_id: uuid.UUID | None = None
    is_competitor_equipment: bool = False
    competitor_product_name: str | None = None
    installation_date: date | None = None
    department: str | None = None

    @model_validator(mode="after")
    def check_product_required(self) -> "InstalledAssetCreate":
        if not self.is_competitor_equipment and self.product_id is None:
            raise ValueError("product_id is required when not competitor equipment")
        return self


class InstalledAssetUpdate(BaseModel):
    product_id: uuid.UUID | None = None
    is_competitor_equipment: bool | None = None
    competitor_product_name: str | None = None
    installation_date: date | None = None
    department: str | None = None


class InstalledAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    product_id: uuid.UUID | None
    is_competitor_equipment: bool
    competitor_product_name: str | None
    installation_date: date | None
    department: str | None
    created_at: datetime
    updated_at: datetime
