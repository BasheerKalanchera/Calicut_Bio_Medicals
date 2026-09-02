import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.schemas import APIResponse
from app.db.session import get_db
from app.domains.marketing_lead.repository import MarketingLeadRepository, MarketingLeadRow
from app.domains.marketing_lead.schemas import (
    AssignedToNested,
    MarketingLeadCreate,
    MarketingLeadDiscard,
    MarketingLeadMarkConverted,
    MarketingLeadResponse,
)
from app.domains.marketing_lead.service import MarketingLeadService
from app.domains.organization.models import UserProfile

router = APIRouter(prefix="/marketing-leads", tags=["Marketing Leads"])


def _get_service(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> MarketingLeadService:
    return MarketingLeadService(repository=MarketingLeadRepository(db), user_id=current_user.id)


def _to_response(row: MarketingLeadRow) -> MarketingLeadResponse:
    lead, account_name, lead_source_name, product_name = row
    return MarketingLeadResponse(
        id=lead.id,
        account_id=lead.account_id,
        sbu_id=lead.sbu_id,
        lead_source_id=lead.lead_source_id,
        event_name=lead.event_name,
        raw_interest_note=lead.raw_interest_note,
        product_id=lead.product_id,
        assigned_to_user_id=lead.assigned_to_user_id,
        assigned_to_user=AssignedToNested.model_validate(lead.assigned_to_user),
        status=lead.status,
        discard_reason=lead.discard_reason,
        discard_note=lead.discard_note,
        converted_opportunity_id=lead.converted_opportunity_id,
        created_by=lead.created_by,
        created_at=lead.created_at,
        reviewed_by=lead.reviewed_by,
        reviewed_at=lead.reviewed_at,
        account_name=account_name,
        lead_source_name=lead_source_name,
        product_name=product_name,
    )


@router.get("")
def list_marketing_leads(
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: MarketingLeadService = Depends(_get_service),  # noqa: B008
) -> APIResponse[list[MarketingLeadResponse]]:
    rows = service.list_leads()
    return APIResponse(data=[_to_response(r) for r in rows])


@router.post("", status_code=201)
def create_marketing_lead(
    data: MarketingLeadCreate,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: MarketingLeadService = Depends(_get_service),  # noqa: B008
) -> APIResponse[MarketingLeadResponse]:
    lead = service.create_lead(data, role_name=current_user.role.role_name)
    row = service.repository.get_enriched_by_id(lead.id)
    return APIResponse(message="Marketing lead created", data=_to_response(row))


@router.patch("/{lead_id}/discard")
def discard_marketing_lead(
    lead_id: uuid.UUID,
    data: MarketingLeadDiscard,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: MarketingLeadService = Depends(_get_service),  # noqa: B008
) -> APIResponse[MarketingLeadResponse]:
    lead = service.discard_lead(lead_id, data, role_name=current_user.role.role_name)
    row = service.repository.get_enriched_by_id(lead.id)
    return APIResponse(message="Marketing lead discarded", data=_to_response(row))


@router.patch("/{lead_id}/mark-converted")
def mark_converted(
    lead_id: uuid.UUID,
    data: MarketingLeadMarkConverted,
    current_user: UserProfile = Depends(get_current_user),  # noqa: B008
    service: MarketingLeadService = Depends(_get_service),  # noqa: B008
) -> APIResponse[MarketingLeadResponse]:
    lead = service.mark_converted(lead_id, data, role_name=current_user.role.role_name)
    row = service.repository.get_enriched_by_id(lead.id)
    return APIResponse(message="Marketing lead marked converted", data=_to_response(row))
