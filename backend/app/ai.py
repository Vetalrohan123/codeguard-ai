import json,httpx
from .config import settings
PROMPT='''You are a conservative senior code reviewer. Report only evidence-backed defects. Return JSON {"findings":[]} where each finding has title,severity,category,confidence,file,line_start,line_end,description,impact,recommendation,suggested_fix. Severity must be CRITICAL,HIGH,MEDIUM,LOW,INFO and confidence 0..1.'''
async def review_code(code:str):
    if not settings.gemini_api_key:return {"findings":[]}
    url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    payload={"contents":[{"parts":[{"text":PROMPT+"\nCODE:\n"+code}]}],"generationConfig":{"responseMimeType":"application/json"}}
    async with httpx.AsyncClient(timeout=90) as c:
        r=await c.post(url,params={"key":settings.gemini_api_key},json=payload);r.raise_for_status();d=r.json()
    return json.loads(d["candidates"][0]["content"]["parts"][0]["text"])
