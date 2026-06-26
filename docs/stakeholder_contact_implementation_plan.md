# Implementation Plan: Stakeholder Contact Details

This document outlines the end-to-end plan to add missing contact details (`designation`, `email`, and `phone`) to the `Stakeholder` entity.

## 1. Architecture & Documentation Updates
* **`docs/Enterprise-Data-Model.md`**: Update the `Stakeholder` entity definition to explicitly include `designation` (String, nullable), `email` (String, nullable), and `phone` (String, nullable) as core attributes.

## 2. Backend: Database & Models
* **Alembic Migration**: Generate a new migration script (e.g., `0002_add_stakeholder_contact_details.py`) to add the three new nullable columns to the `stakeholder` table.
* **SQLAlchemy Model**: Update the `Stakeholder` class in `backend/app/domains/account/models.py`:
  ```python
  designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
  email: Mapped[str | None] = mapped_column(String(255), nullable=True)
  phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
  ```

## 3. Backend: Schemas & Services

### Pydantic Schemas (`backend/app/domains/account/stakeholder_schemas.py`)

There is no `StakeholderBase` class in this file. The three schema classes are independent and must each be updated individually:

* **`StakeholderCreate`**: Add the three fields as optional with `None` default:
  ```python
  designation: str | None = Field(None, max_length=100)
  email: EmailStr | None = None
  phone: str | None = Field(None, max_length=50)
  ```
* **`StakeholderUpdate`**: Same field definitions (omitting a field = leave unchanged; sending `null` explicitly = clear the field, consistent with the existing `nps_score` pattern).
* **`StakeholderResponse`**: Add the three fields as `str | None`. No `EmailStr` needed on the response since it is output-only.

**Email validation**: Use Pydantic's `EmailStr` type (from `pydantic[email]`) on `StakeholderCreate` and `StakeholderUpdate`. This rejects malformed email strings at the API boundary. Verify `pydantic[email]` is present in `pyproject.toml` before using it; if not, add it or use a `field_validator` with a regex as an alternative.

### Workspace Schema (`backend/app/domains/account/workspace_schemas.py`)

`WorkspaceStakeholder` is a separate schema used by the workspace endpoint and currently only has `id`, `name`, `nps_score`, `sentiment`. Add the three new fields here as well to keep it in sync with `StakeholderResponse`:
```python
designation: str | None
email: str | None
phone: str | None
```
Omitting this would cause a silent data gap if the workspace endpoint is ever used to display stakeholder contact details.

### Service Layer (`backend/app/domains/account/stakeholder_service.py`)

* **`create_stakeholder`**: The constructor call explicitly names each field. Add the three new fields:
  ```python
  stakeholder = Stakeholder(
      account_id=account_id,
      name=data.name,
      nps_score=data.nps_score,
      sentiment=data.sentiment,
      designation=data.designation,
      email=data.email,
      phone=data.phone,
      created_by=created_by,
      updated_by=created_by,
  )
  ```
* **`update_stakeholder`**: No changes needed. It uses `model_dump(exclude_unset=True)` and a `setattr` loop, so new schema fields are handled automatically.

## 4. Frontend: State & UI (`Customer360Screen.jsx`)
* **State Management**:
  * Add new state variables for creation: `newStakeholderDesignation`, `newStakeholderEmail`, `newStakeholderPhone`.
  * Add new state variables for editing: `editStakeholderDesignation`, `editStakeholderEmail`, `editStakeholderPhone`.
* **Modal Handlers**:
  * Update `openCreateStakeholder` to clear the new state fields.
  * Update `openEditStakeholder` to populate the state fields from the selected stakeholder.
  * Update `handleCreateStakeholder` and `handleUpdateStakeholder` to append these values to the `payload` sent to the API.
* **UI Forms**:
  * Add input fields for Designation, Email, and Phone to both the "Add Stakeholder" and "Edit Stakeholder" modals.
* **UI Display (List View)**:
  * Update the `StakeholdersTab` list cards to display the Designation (e.g., next to or below the name), Email, and Phone icons/text if the data is present.

## 5. Tests

The following test files require fixture and assertion updates:

* **`backend/tests/domains/account/test_stakeholder_service.py`**:
  * Add `designation`, `email`, `phone` (all `None` by default) to `_make_stakeholder()`.
  * Extend `TestCreateStakeholder.test_creates_stakeholder` to assert the new fields are passed through correctly.

* **`backend/tests/domains/account/test_stakeholder_router.py`**:
  * Add `designation`, `email`, `phone` to `_mock_stakeholder()`.
  * Add the three attribute names to the `_capture_add` helper in `TestCreateStakeholder.test_creates_stakeholder`.

* **`backend/tests/domains/account/test_workspace_service.py`**:
  * Add `designation`, `email`, `phone` to `_mock_stakeholder()` after `WorkspaceStakeholder` is updated (see Section 3).
