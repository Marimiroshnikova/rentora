import math

CITY_COORDS: dict[str, tuple[float, float]] = {
    "tbilisi": (41.7151, 44.8271),
    "batumi": (41.6168, 41.6367),
    "kutaisi": (42.2679, 42.6946),
    "rustavi": (41.5495, 45.0),
    "gori": (41.9842, 44.1158),
}


def coords_for_city(city: str) -> tuple[float, float]:
    key = (city or "").strip().lower()
    return CITY_COORDS.get(key, CITY_COORDS["tbilisi"])


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
