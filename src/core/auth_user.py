"""
Simple auth user lookup (no DB). For production, replace with DB or external IdP.
"""
from src.api.schemas.auth import UserOut
from src.core.config import DEMO_USERNAME, DEMO_PASSWORD_HASH
from src.core.security import hash_password, verify_password

# Default password hashed at module load if no env hash set (username: admin, password: admin)
_DEFAULT_DEMO_HASH = hash_password("admin")
DEMO_HASH = DEMO_PASSWORD_HASH if DEMO_PASSWORD_HASH else _DEFAULT_DEMO_HASH


def get_user_by_credentials(username: str, password: str) -> UserOut | None:
    """Validate credentials and return user if valid."""
    if username != DEMO_USERNAME:
        return None
    if not verify_password(password, DEMO_HASH):
        return None
    return UserOut(id="1", username=username)
