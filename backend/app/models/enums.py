import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class Category(str, enum.Enum):
    BALLOONS = "BALLOONS"
    BACKDROPS = "BACKDROPS"
    TABLEWARE = "TABLEWARE"
    LIGHTING = "LIGHTING"
    PROPS = "PROPS"
    FLORAL = "FLORAL"
    KIDS = "KIDS"
    PHOTOSHOOT = "PHOTOSHOOT"
    OTHER = "OTHER"


class ListingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    HIDDEN = "HIDDEN"


class Condition(str, enum.Enum):
    NEW = "NEW"
    GOOD = "GOOD"
    FAIR = "FAIR"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"


class BlockReason(str, enum.Enum):
    BOOKED = "BOOKED"
    MANUAL = "MANUAL"


class NotificationType(str, enum.Enum):
    BOOKING_REQUESTED = "BOOKING_REQUESTED"
    BOOKING_ACCEPTED = "BOOKING_ACCEPTED"
    BOOKING_DECLINED = "BOOKING_DECLINED"
    PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    BOOKING_CANCELLED = "BOOKING_CANCELLED"
    BOOKING_COMPLETED = "BOOKING_COMPLETED"
    NEW_MESSAGE = "NEW_MESSAGE"
