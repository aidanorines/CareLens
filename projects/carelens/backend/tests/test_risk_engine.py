from __future__ import annotations

from src.risk_engine import compute_news2_score


def test_demo_patient_elena_defaults_and_temp_conversion():
    # Mirrors `frontend/src/data/mockPatients.ts` (Elena Ramirez)
    patient = {
        "id": "p-1001",
        "name": "Elena Ramirez",
        "age": 78,
        "sex": "Female",
        "conditions": ["Type 2 diabetes", "Hypertension", "Chronic kidney disease stage 3"],
        "medications": ["Metformin", "Lisinopril", "Atorvastatin", "Insulin glargine"],
        "vitals": {
            "bloodPressure": "168/94",
            "heartRate": 92,
            "bmi": 31.4,
            "temperature": 99.1,  # Fahrenheit in mock data
            "oxygenSaturation": 94,
        },
    }

    result = compute_news2_score(patient)

    assert result["spo2_scale"] == "Scale1"
    assert result["score"] is not None
    assert result["risk_level"] in ("Low", "Moderate", "High")
    assert isinstance(result["flags"], list)
    assert result["components"]["systolic_bp"] == 0  # SBP 168 -> 0
    assert result["components"]["heart_rate"] == 1  # HR 92 -> 1
    assert result["components"]["spo2"] == 1  # SpO2 94 -> 1

    # Option B defaults should be used because the mock patient lacks them.
    assert "resp_rate" in result["defaults_used"]
    assert "on_oxygen" in result["defaults_used"]
    assert "consciousness" in result["defaults_used"]

    # Confirm Fahrenheit -> Celsius conversion path was used.
    assert result["inputs_used"]["temp_source"] == "temperature (F) converted to C"


def test_missing_spo2_is_insufficient_data_even_with_defaults():
    patient = {
        "vitals": {
            "bloodPressure": "120/80",
            "heartRate": 80,
            "temperature": 98.6,
        }
    }

    result = compute_news2_score(patient)
    assert result["category"] == "Insufficient Data"
    assert result["risk_level"] == "Insufficient Data"
    assert "spo2" in result["missing_fields"]


def test_single_three_point_parameter_triggers_medium_category():
    # RR <= 8 is 3 points; with other fields present, should be Medium even if total < 5.
    patient = {
        "vitals": {
            "respRate": 8,
            "oxygenSaturation": 98,
            "bloodPressure": "120/80",
            "heartRate": 70,
            "temperature": 98.6,
            "onOxygen": False,
            "consciousness": "A",
        }
    }

    result = compute_news2_score(patient)
    assert result["components"]["resp_rate"] == 3
    assert result["category"] == "Medium"
    assert result["risk_level"] == "Moderate"

