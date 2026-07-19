from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
EXT_FOR_TYPE = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def sniff_image(content: bytes) -> str | None:
    if content[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


async def read_and_validate_image(file: UploadFile) -> tuple[bytes, str]:
    """Return (bytes, extension) after MIME/ext/magic checks and EXIF strip."""
    ext = Path(file.filename or "img.jpg").suffix.lower() or ".jpg"
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    sniffed = sniff_image(content)
    if sniffed is None or sniffed not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File content is not a valid image")
    out_ext = EXT_FOR_TYPE[sniffed]
    try:
        from PIL import Image

        img = Image.open(BytesIO(content))
        if sniffed == "image/jpeg":
            img = img.convert("RGB")
        buf = BytesIO()
        fmt = "JPEG" if sniffed == "image/jpeg" else sniffed.split("/")[-1].upper()
        save_kwargs = {"quality": 90} if fmt == "JPEG" else {}
        img.save(buf, format=fmt, **save_kwargs)
        content = buf.getvalue()
    except Exception:
        pass
    return content, out_ext
