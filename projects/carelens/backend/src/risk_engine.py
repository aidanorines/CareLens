"""Deterministic risk engine for CareLens (NEWS2).

This module implements the National Early Warning Score 2 (NEWS2) using
deterministic rules only (no LLM). It is intended to be used alongside the
AI summary module for clinical decision support workflows.

MVP assumptions:
- Uses **SpO2 Scale 1** only (no COPD/hypercapnic RF Scale 2 support yet).
- Expects a normalized patient dict (not raw FHIR bundle).
- **Demo defaults (Option B)**: if respiratory rate, supplemental oxygen, or
  consciousness are missing, the engine applies conservative *synthetic demo*
  defaults so the hackathon UI can always render a NEWS2 score. These defaults
  are **not** a substitute for real clinical documentation and must be
  disclosed in product docs / responsible-ai notes.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Tuple, TypedDict, Union


RiskCategory = Literal["Low", "Medium", "High", "Insufficient Data"]
UiRiskLevel = Literal["Low", "Moderate", "High", "Insufficient Data"]
Avpu = Literal["A", "V", "P", "U"]


class News2Components(TypedDict, total=False):
    resp_rate: int
    spo2: int
    on_oxygen: int
    temp_c: int
    systolic_bp: int
    heart_rate: int
    consciousness: int


class News2Result(TypedDict):
    score: Optional[int]
    category: RiskCategory
    risk_level: UiRiskLevel
    flags: List[str]
    components: News2Components
    missing_fields: List[str]
    spo2_scale: Literal["Scale1"]
    defaults_used: Dict[str, Any]
    inputs_used: Dict[str, Any]


def _to_ui_risk_level(category: RiskCategory) -> UiRiskLevel:
    if category == "Medium":
        return "Moderate"
    return category  # type: ignore[return-value]


def _build_flags(
    *,
    category: RiskCategory,
    components: News2Components,
    inputs_used: Dict[str, Any],
    defaults_used: Dict[str, Any],
    missing_fields: List[str],
) -> List[str]:
    flags: List[str] = []

    if category == "Insufficient Data":
        if missing_fields:
            flags.append(f"Insufficient data for NEWS2: missing {', '.join(missing_fields)}")
        return flags

    # Deterministic “why” flags from non-zero components.
    def add_if(component_key: str, label: str) -> None:
        points = components.get(component_key)
        if points is None or points == 0:
            return
        value = inputs_used.get(component_key)
        if value is None:
            flags.append(f"{label} (+{points})")
        else:
            flags.append(f"{label} {value} (+{points})")

    add_if("spo2", "Low SpO2")
    add_if("resp_rate", "Abnormal respiratory rate")
    add_if("on_oxygen", "On supplemental oxygen")
    add_if("temp_c", "Abnormal temperature (C)")
    add_if("systolic_bp", "Abnormal systolic BP")
    add_if("heart_rate", "Abnormal heart rate")
    add_if("consciousness", "Altered consciousness/new confusion")

    # Always disclose demo defaults if used.
    for key, meta in defaults_used.items():
        flags.append(f"Demo default applied: {key} ({meta.get('reason')})")

    return flags


def _as_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        if isinstance(value, bool):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _as_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    return None


def _parse_systolic_bp(vitals: Dict[str, Any]) -> Optional[float]:
    for key in ("systolic_bp", "sbp_mmHg", "bloodPressureSystolic", "systolicBP"):
        if key in vitals:
            return _as_float(vitals.get(key))

    # Common string format: "148/92"
    for key in ("bp_mmHg", "bloodPressure", "bp"):
        bp = vitals.get(key)
        if isinstance(bp, str) and "/" in bp:
            sbp_str = bp.split("/", 1)[0].strip()
            return _as_float(sbp_str)

    return None


def _parse_consciousness(vitals: Dict[str, Any]) -> Optional[Union[Avpu, Literal["CONFUSION"]]]:
    # Prefer AVPU if present
    for key in ("consciousness", "avpu"):
        raw = vitals.get(key)
        if isinstance(raw, str):
            val = raw.strip().upper()
            if val in ("A", "V", "P", "U"):
                return val  # type: ignore[return-value]

    # If we only know "new confusion", NEWS2 treats it as 3 points
    for key in ("new_confusion", "newConfusion", "confusion"):
        if vitals.get(key) is True:
            return "CONFUSION"

    return None


def _infer_temp_c(vitals: Dict[str, Any]) -> Tuple[Optional[float], Optional[str]]:
    """Infer temperature in Celsius from common frontend fields.

    CareLens mock data uses `temperature` in Fahrenheit-ish ranges (e.g. 98–99).
    If a Celsius field is present (`temp_C` / `tempC` / `temperatureC`), it wins.
    """
    for key in ("temp_C", "tempC", "temperatureC"):
        if key in vitals:
            val = _as_float(vitals.get(key))
            return val, f"{key} (assumed C)"

    if "temperature" in vitals:
        f_val = _as_float(vitals.get("temperature"))
        if f_val is None:
            return None, None
        # Heuristic: values > 45 are almost certainly Fahrenheit for human vitals
        if f_val > 45:
            c_val = (f_val - 32.0) * (5.0 / 9.0)
            return c_val, "temperature (F) converted to C"
        return f_val, "temperature (assumed C)"

    return None, None


def _score_resp_rate(rr: Optional[float]) -> Optional[int]:
    if rr is None:
        return None
    if rr <= 8:
        return 3
    if 9 <= rr <= 11:
        return 1
    if 12 <= rr <= 20:
        return 0
    if 21 <= rr <= 24:
        return 2
    return 3  # >= 25


def _score_spo2_scale1(spo2: Optional[float]) -> Optional[int]:
    if spo2 is None:
        return None
    if spo2 <= 91:
        return 3
    if 92 <= spo2 <= 93:
        return 2
    if 94 <= spo2 <= 95:
        return 1
    return 0  # >= 96


def _score_on_oxygen(on_oxygen: Optional[bool]) -> Optional[int]:
    if on_oxygen is None:
        return None
    return 2 if on_oxygen else 0


def _score_temp(temp_c: Optional[float]) -> Optional[int]:
    if temp_c is None:
        return None
    if temp_c <= 35.0:
        return 3
    if 35.1 <= temp_c <= 36.0:
        return 1
    if 36.1 <= temp_c <= 38.0:
        return 0
    if 38.1 <= temp_c <= 39.0:
        return 1
    return 2  # >= 39.1


def _score_systolic_bp(sbp: Optional[float]) -> Optional[int]:
    if sbp is None:
        return None
    if sbp <= 90:
        return 3
    if 91 <= sbp <= 100:
        return 2
    if 101 <= sbp <= 110:
        return 1
    if 111 <= sbp <= 219:
        return 0
    return 3  # >= 220


def _score_heart_rate(hr: Optional[float]) -> Optional[int]:
    if hr is None:
        return None
    if hr <= 40:
        return 3
    if 41 <= hr <= 50:
        return 1
    if 51 <= hr <= 90:
        return 0
    if 91 <= hr <= 110:
        return 1
    if 111 <= hr <= 130:
        return 2
    return 3  # >= 131


def _score_consciousness(consciousness: Optional[Union[Avpu, Literal["CONFUSION"]]]) -> Optional[int]:
    if consciousness is None:
        return None
    if consciousness == "A":
        return 0
    if consciousness in ("V", "P", "U", "CONFUSION"):
        return 3
    return None


def compute_news2_components(patient: Dict[str, Any]) -> Tuple[News2Components, Dict[str, Any], Dict[str, Any]]:
    """Compute NEWS2 component scores.

    Accepted normalized input (common aliases supported):
    - resp_rate: `vitals.resp_rate`, `vitals.respRate`, `vitals.respiratoryRate`
    - spo2: `vitals.spo2_pct`, `vitals.spo2`, `vitals.oxygenSaturation`
    - systolic BP: `vitals.systolic_bp`, `vitals.sbp_mmHg`, `vitals.bp_mmHg` ("148/92"), ...
    - heart rate: `vitals.hr_bpm`, `vitals.heartRate`, `vitals.pulse`
    - temperature: `vitals.temp_C`, `vitals.tempC`, `vitals.temperatureC`, `vitals.temperature` (°F heuristic)
    - on oxygen: `vitals.on_supplemental_o2`, `vitals.onOxygen`, ...
    - consciousness: `vitals.consciousness` (AVPU) or `vitals.new_confusion` boolean

    Demo defaults (Option B):
    - Missing RR -> assume 16 breaths/min (0 points in normal band)
    - Missing supplemental oxygen -> assume False (0 points)
    - Missing consciousness -> assume Alert ("A") (0 points)
    """
    vitals = patient.get("vitals") if isinstance(patient.get("vitals"), dict) else patient

    defaults_used: Dict[str, Any] = {}
    inputs_used: Dict[str, Any] = {}

    rr = _as_float(vitals.get("resp_rate") or vitals.get("respRate") or vitals.get("respiratoryRate"))
    if rr is None:
        rr = 16.0
        defaults_used["resp_rate"] = {"value": rr, "reason": "missing; demo default RR=16"}
    inputs_used["resp_rate"] = rr

    spo2 = _as_float(vitals.get("spo2_pct") or vitals.get("spo2") or vitals.get("oxygenSaturation"))
    inputs_used["spo2"] = spo2

    sbp = _parse_systolic_bp(vitals)
    inputs_used["systolic_bp"] = sbp

    hr = _as_float(vitals.get("hr_bpm") or vitals.get("heartRate") or vitals.get("pulse"))
    inputs_used["heart_rate"] = hr

    temp_c, temp_note = _infer_temp_c(vitals)
    inputs_used["temp_c"] = temp_c
    if temp_note:
        inputs_used["temp_source"] = temp_note

    on_oxygen = _as_bool(
        vitals.get("on_supplemental_o2")
        if "on_supplemental_o2" in vitals
        else vitals.get("onOxygen") if "onOxygen" in vitals else vitals.get("supplementalOxygen")
    )
    if on_oxygen is None:
        on_oxygen = False
        defaults_used["on_oxygen"] = {"value": on_oxygen, "reason": "missing; demo default not on oxygen"}
    inputs_used["on_oxygen"] = on_oxygen

    consciousness = _parse_consciousness(vitals)
    if consciousness is None:
        consciousness = "A"
        defaults_used["consciousness"] = {"value": consciousness, "reason": "missing; demo default Alert (A)"}
    inputs_used["consciousness"] = consciousness

    components: News2Components = {}

    components["resp_rate"] = _score_resp_rate(rr)  # type: ignore[assignment]
    components["spo2"] = _score_spo2_scale1(spo2)  # type: ignore[assignment]
    components["on_oxygen"] = _score_on_oxygen(on_oxygen)  # type: ignore[assignment]
    components["temp_c"] = _score_temp(temp_c)  # type: ignore[assignment]
    components["systolic_bp"] = _score_systolic_bp(sbp)  # type: ignore[assignment]
    components["heart_rate"] = _score_heart_rate(hr)  # type: ignore[assignment]
    components["consciousness"] = _score_consciousness(consciousness)  # type: ignore[assignment]

    missing = [k for k, v in components.items() if v is None]
    return components, defaults_used, inputs_used


def compute_news2_score(patient: Dict[str, Any]) -> News2Result:
    """Compute NEWS2 score + standard escalation category.

    Escalation (standard NEWS2 guidance):
    - High: score >= 7
    - Medium: score 5–6 OR any single parameter scores 3
    - Low: score 0–4 with no 3s
    """
    components, defaults_used, inputs_used = compute_news2_components(patient)
    missing = [k for k, v in components.items() if v is None]
    if missing:
        category: RiskCategory = "Insufficient Data"
        return {
            "score": None,
            "category": category,
            "risk_level": _to_ui_risk_level(category),
            "flags": _build_flags(
                category=category,
                components=components,
                inputs_used=inputs_used,
                defaults_used=defaults_used,
                missing_fields=missing,
            ),
            "components": components,
            "missing_fields": missing,
            "spo2_scale": "Scale1",
            "defaults_used": defaults_used,
            "inputs_used": inputs_used,
        }

    score = sum(int(v) for v in components.values() if v is not None)
    has_three = any(v == 3 for v in components.values())
    if score >= 7:
        category: RiskCategory = "High"
    elif score >= 5 or has_three:
        category = "Medium"
    else:
        category = "Low"

    return {
        "score": score,
        "category": category,
        "risk_level": _to_ui_risk_level(category),
        "flags": _build_flags(
            category=category,
            components=components,
            inputs_used=inputs_used,
            defaults_used=defaults_used,
            missing_fields=[],
        ),
        "components": components,
        "missing_fields": [],
        "spo2_scale": "Scale1",
        "defaults_used": defaults_used,
        "inputs_used": inputs_used,
    }


if __name__ == "__main__":
    # Minimal smoke test; full cases live in `tests/test_risk_engine.py`.
    demo_patient: Dict[str, Any] = {"vitals": {"bloodPressure": "120/80", "heartRate": 75, "temperature": 98.6, "oxygenSaturation": 98}}
    print(compute_news2_score(demo_patient))

