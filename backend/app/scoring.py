WEIGHTS={"CRITICAL":30,"HIGH":15,"MEDIUM":7,"LOW":2,"INFO":0}
def calculate_score(findings): return max(0.0,round(100-sum(WEIGHTS.get(x.get("severity"),0)*float(x.get("confidence",0)) for x in findings),2))
