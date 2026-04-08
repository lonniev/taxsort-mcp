"""Custom category/subcategory management."""

from db.neon import fetch, execute


async def get_custom_categories(owner_npub: str) -> dict:
    """Get all custom categories for a user."""
    rows = await fetch(
        "SELECT id, category, subcategory FROM tax_categories WHERE owner_npub=$1 ORDER BY category, subcategory",
        owner_npub,
    )
    return {
        "categories": [
            {"id": int(r["id"]), "category": str(r["category"]), "subcategory": str(r["subcategory"])}
            for r in rows
        ],
    }


async def save_custom_category(owner_npub: str, category: str, subcategory: str) -> dict:
    """Add a custom category/subcategory pair."""
    if not category or not subcategory:
        return {"error": "Both category and subcategory are required."}

    result = await execute(
        """
        INSERT INTO tax_categories (owner_npub, category, subcategory)
        VALUES ($1, $2, $3)
        ON CONFLICT (owner_npub, category, subcategory) DO NOTHING
        """,
        owner_npub, category, subcategory,
    )
    return {"category": category, "subcategory": subcategory}


async def delete_custom_category(owner_npub: str, category_id: int) -> dict:
    """Delete a custom category."""
    await execute(
        "DELETE FROM tax_categories WHERE id=$1 AND owner_npub=$2",
        category_id, owner_npub,
    )
    return {"deleted": category_id}
