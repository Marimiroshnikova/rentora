from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


BCRYPT_MAX_BYTES = 72


def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")


def assert_password_length(password: str) -> None:
    if len(_password_bytes(password)) > BCRYPT_MAX_BYTES:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail=f"Password must be at most {BCRYPT_MAX_BYTES} bytes",
        )


def hash_password(password: str) -> str:
    assert_password_length(password)
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    # bcrypt truncates silently past 72 bytes; reject over-long inputs explicitly
    if len(_password_bytes(plain)) > BCRYPT_MAX_BYTES:
        return False
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str | int, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        return str(sub) if sub is not None else None
    except JWTError:
        return None
