from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Any


class PyObjectId(str):
    """Custom type that coerces ObjectId <-> str for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, value: Any) -> str:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, str):
            if ObjectId.is_valid(value):
                return value
            raise ValueError(f"Invalid ObjectId string: {value}")
        raise TypeError(f"ObjectId or str expected, got {type(value)}")

    def __repr__(self) -> str:
        return f"PyObjectId({super().__repr__()})"


def object_id_to_str(obj_id) -> str:
    """Safely convert an ObjectId or string to str."""
    if obj_id is None:
        return None
    return str(obj_id)


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id (ObjectId) to str 'id'."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    # Recursively convert any nested ObjectIds
    for key, val in doc.items():
        if isinstance(val, ObjectId):
            doc[key] = str(val)
    return doc
