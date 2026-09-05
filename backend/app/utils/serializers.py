# app/utils/serializers.py
from typing import Any, Dict, List, TypeVar
from pydantic import BaseModel
from bson import ObjectId


T = TypeVar("T", bound=BaseModel)


def doc_to_model(doc: Dict[str, Any], model: type[T]) -> T:
    """Convert a MongoDB document to a Pydantic model instance."""
    if doc is None:
        return None
    # Convert ObjectId to string for _id field
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    # Convert any ObjectId fields in nested documents
    doc = _convert_objectids(doc)
    return model(**doc)


def docs_to_models(docs: List[Dict[str, Any]], model: type[T]) -> List[T]:
    """Convert a list of MongoDB documents to Pydantic model instances."""
    return [doc_to_model(doc, model) for doc in docs]


def _convert_objectids(obj: Any) -> Any:
    """Recursively convert ObjectId instances to strings."""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: _convert_objectids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_objectids(item) for item in obj]
    return obj