# BobcatSurge

Risk scoring + AI patient summary

## AI Summary Script (`src/ai_summary.py`)

This script generates a concise clinician-facing summary from structured patient data
by calling the Hugging Face Router (Inference Providers) chat-completions API.

The prompt is strict by design:
- Clinical decision support only (not a clinician)
- Uses only the provided patient data
- If unsure/missing info: outputs **`I don't have enough information.`**
- Always includes a clinical disclaimer

## Setup

From the project `src/` directory:

```bash
pip install -r requirements.txt
```

## Configure

Set your Hugging Face token (required). Optionally override the model.

**Recommended:** create `CareBridge/projects/BobcatSurge/.env` (this file is gitignored).

1. Copy `CareBridge/projects/BobcatSurge/.env.example` -> `CareBridge/projects/BobcatSurge/.env`
2. Edit `.env` to include:
   - `HF_TOKEN=hf_...`
   - `HF_MODEL=meta-llama/Llama-3.1-8B-Instruct`

PowerShell:

```powershell
$env:HF_TOKEN = "hf_xxx_your_token_here"
#Current Default
$env:HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
```

bash/zsh:

```bash
export HF_TOKEN="hf_xxx_your_token_here"
export HF_MODEL="meta-llama/Llama-3.1-8B-Instruct"
```

## Run the demo

The script includes a **fake** test patient record under `if __name__ == "__main__":`:

```bash
python ai_summary.py
```

## Use from Python

```python
from ai_summary import generate_patient_summary

summary = generate_patient_summary(patient_data)
print(summary)
```
