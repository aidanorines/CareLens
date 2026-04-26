from flask import Flask, jsonify, request
from flask_cors import CORS

from database.db import init_db
from database.patient_repository import (
    insert_patient,
    get_all_patients,
    get_patient_by_id,
)

app = Flask(__name__)
CORS(app)

init_db()


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "CareLens backend is running"})


@app.route("/api/patients", methods=["GET"])
def patients():
    rows = get_all_patients()

    patient_list = []
    for row in rows:
        patient_list.append(dict(row))

    return jsonify(patient_list)


@app.route("/api/patients/<int:patient_id>", methods=["GET"])
def patient_by_id(patient_id):
    row = get_patient_by_id(patient_id)

    if row is None:
        return jsonify({"error": "Patient not found"}), 404

    return jsonify(dict(row))


@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json()

    patient_id = insert_patient(
        fhir_id=data.get("fhir_id"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        gender=data.get("gender"),
        birth_date=data.get("birth_date"),
        raw_json=data.get("raw_json"),
    )

    return jsonify({
        "message": "Patient created successfully",
        "patient_id": patient_id
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)