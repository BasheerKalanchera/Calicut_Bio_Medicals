import uuid
from decimal import Decimal
from unittest.mock import MagicMock

from app.domains.product.models import Product
from app.domains.product.repository import ProductRepository


def _make_product(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "sbu_id": uuid.uuid4(),
        "name": "SonoScape S50",
        "oem_name": "SonoScape",
        "model_number": "S50",
        "category_name": "Ultrasound",
        "is_active": True,
    }
    defaults.update(overrides)
    obj = MagicMock(spec=Product)
    for k, v in defaults.items():
        setattr(obj, k, v)
    return obj


class TestProductRepositoryGetById:
    def test_returns_product_when_found(self):
        product = _make_product()
        mock_db = MagicMock()
        mock_db.get.return_value = product

        repo = ProductRepository(mock_db)
        assert repo.get_by_id(product.id) is product

    def test_returns_none_when_not_found(self):
        mock_db = MagicMock()
        mock_db.get.return_value = None

        repo = ProductRepository(mock_db)
        assert repo.get_by_id(uuid.uuid4()) is None


class TestProductRepositoryListProducts:
    def test_returns_products_and_total(self):
        product = _make_product()
        mock_db = MagicMock()
        mock_db.scalar.return_value = 1
        mock_db.scalars.return_value.unique.return_value.all.return_value = [product]

        repo = ProductRepository(mock_db)
        results, total = repo.list_products()

        assert total == 1
        assert len(results) == 1

    def test_returns_empty_when_no_products(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = ProductRepository(mock_db)
        results, total = repo.list_products()

        assert total == 0
        assert results == []

    def test_applies_pagination(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        repo = ProductRepository(mock_db)
        repo.list_products(offset=10, limit=5)

        mock_db.scalars.assert_called_once()


def _compiled(stmt) -> str:
    return str(stmt.compile(compile_kwargs={"literal_binds": True}))


class TestProductRepositoryActiveFilter:
    def test_default_list_leaves_out_inactive_products(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        ProductRepository(mock_db).list_products()

        sql = _compiled(mock_db.scalars.call_args.args[0])
        # "IS NOT false", not "= true": an empty (NULL) flag counts as active.
        assert "product.is_active IS NOT false" in sql

    def test_active_only_false_includes_inactive_products(self):
        mock_db = MagicMock()
        mock_db.scalar.return_value = 0
        mock_db.scalars.return_value.unique.return_value.all.return_value = []

        ProductRepository(mock_db).list_products(active_only=False)

        sql = _compiled(mock_db.scalars.call_args.args[0])
        assert "product.is_active IS NOT false" not in sql


class TestFillEmptyWonCosts:
    """Margin Report plan D16: a product's first catalog cost fills its Won
    product lines that have no saved cost, marked "filled in later"."""

    def _run(self):
        mock_db = MagicMock()
        product_id = uuid.uuid4()
        ProductRepository(mock_db).fill_empty_won_costs(product_id, Decimal("5.00"))
        mock_db.execute.assert_called_once()
        return _compiled(mock_db.execute.call_args.args[0]), product_id

    def test_updates_only_this_products_product_lines(self):
        sql, product_id = self._run()
        assert sql.startswith("UPDATE opportunity_item SET")
        assert f"opportunity_item.product_id = '{product_id.hex}'" in sql
        assert "opportunity_item.line_type = 'PRODUCT'" in sql

    def test_never_touches_a_line_that_already_has_a_saved_cost(self):
        sql, _ = self._run()
        assert "opportunity_item.cost_at_won_lakhs IS NULL" in sql

    def test_only_reaches_lines_on_won_opportunities(self):
        sql, _ = self._run()
        assert "opportunity_status.status_code = 'WON'" in sql

    def test_copies_the_cost_and_sets_the_filled_in_later_marker(self):
        sql, _ = self._run()
        assert "cost_at_won_lakhs=5.00" in sql
        assert "cost_filled_in_later=true" in sql


class TestProductRepositoryUsageCounts:
    """Product Deactivate plan D3/D4: open Opportunities (status not terminal)
    and marketing leads still waiting (status NEW)."""

    def _run(self, opportunities: int | None, leads: int | None):
        mock_db = MagicMock()
        mock_db.scalar.side_effect = [opportunities, leads]
        product_id = uuid.uuid4()
        result = ProductRepository(mock_db).usage_counts(product_id)
        opportunity_sql = _compiled(mock_db.scalar.call_args_list[0].args[0])
        lead_sql = _compiled(mock_db.scalar.call_args_list[1].args[0])
        return result, opportunity_sql, lead_sql, product_id

    def test_returns_both_counts(self):
        result, _, _, _ = self._run(2, 1)
        assert result == (2, 1)

    def test_none_counts_become_zero(self):
        result, _, _, _ = self._run(None, None)
        assert result == (0, 0)

    def test_opportunities_counted_by_line_item_and_non_terminal_status(self):
        _, sql, _, product_id = self._run(0, 0)
        assert f"opportunity_item.product_id = '{product_id.hex}'" in sql
        assert "opportunity_status.is_terminal = false" in sql
        # Counted once per Opportunity, not once per line.
        assert "JOIN opportunity_item" not in sql

    def test_leads_counted_only_while_new(self):
        _, _, sql, product_id = self._run(0, 0)
        assert f"marketing_lead.product_id = '{product_id.hex}'" in sql
        assert "marketing_lead.status = 'NEW'" in sql
