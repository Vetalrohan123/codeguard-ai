import asyncio
from celery import shared_task
from ..database import SessionLocal
from ..models import Review,ReviewFinding,ReviewStatus,Severity
from ..ai import review_code
from ..scoring import calculate_score
@shared_task
def run_review(review_id:str): asyncio.run(_run(review_id))
async def _run(review_id):
    async with SessionLocal() as db:
        review=await db.get(Review,review_id)
        if not review:return
        review.status=ReviewStatus.ANALYZING;await db.commit()
        sample='''def find_user(user_input):\n    query = "SELECT * FROM users WHERE name = '" + user_input + "'"\n    return query\n'''
        try:
            data=await review_code(sample); fs=data.get("findings",[])
            for x in fs:
                db.add(ReviewFinding(review_id=review.id,title=x["title"],severity=Severity(x["severity"]),category=x["category"],confidence=float(x["confidence"]),file=x["file"],line_start=int(x["line_start"]),line_end=int(x["line_end"]),description=x["description"],impact=x["impact"],recommendation=x["recommendation"],suggested_fix=x.get("suggested_fix")))
            review.score=calculate_score(fs);review.status=ReviewStatus.COMPLETED
        except Exception: review.status=ReviewStatus.FAILED
        await db.commit()
