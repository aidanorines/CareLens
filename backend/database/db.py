import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "carelens.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"


def get_connection():
    """
    Creates and returns a SQLite database connection.
    row_factory lets us access rows like dictionaries.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initializes the database using schema.sql.
    Creates the database file automatically if it does not exist.
    """
    with get_connection() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
            conn.executescript(schema_file.read())
        conn.commit()


def row_to_dict(row):
    """
    Converts a SQLite row object into a normal Python dictionary.
    """
    if row is None:
        return None
    return dict(row)