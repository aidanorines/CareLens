# projects/carelens/backend/database/patient_repository.py

from .db import get_connection


def insert_patient(fhir_id, first_name, last_name, gender, birth_date, raw_json):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO patients (fhir_id, first_name, last_name, gender, birth_date, raw_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (fhir_id, first_name, last_name, gender, birth_date, raw_json),
        )
        conn.commit()
        return cursor.lastrowid


def get_all_patients():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients ORDER BY created_at DESC")
        return cursor.fetchall()


def get_patient_by_id(patient_id):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM patients WHERE id = ?",
            (patient_id,),
        )
        return cursor.fetchone()