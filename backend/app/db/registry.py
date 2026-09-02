# Model import registry — ensures all ORM classes register with
# Base.metadata before Alembic autogenerate inspects it.
#
# Every domain's models module must be imported here.
# Add new domains as they are created.

from app.domains.account import models as _acct  # noqa: F401
from app.domains.activity import models as _act  # noqa: F401
from app.domains.asset import models as _asset  # noqa: F401
from app.domains.audit import models as _audit  # noqa: F401
from app.domains.document import models as _doc  # noqa: F401
from app.domains.notification import models as _notif  # noqa: F401
from app.domains.opportunity import models as _opp  # noqa: F401
from app.domains.organization import models as _org  # noqa: F401
from app.domains.planning import models as _plan  # noqa: F401
from app.domains.product import models as _prod  # noqa: F401
from app.domains.project import models as _proj  # noqa: F401
from app.domains.reference import models as _ref  # noqa: F401
