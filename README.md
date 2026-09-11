# CodeGuard AI — Phase 1

A runnable foundation for a production AI code-review SaaS.

### Included
- Next.js frontend with developer-focused dashboard
- FastAPI API
- PostgreSQL persistence
- Redis + Celery background review jobs
- Structured review findings and quality scoring
- Gemini provider boundary
- Docker Compose orchestration

### Run
```powershell
Copy-Item .env.example .env
docker compose up --build
```
Open http://localhost:3000 and http://localhost:8000/docs.

### Architecture
Next.js → FastAPI → PostgreSQL + Redis → Celery worker → AI review → findings/score.

### Next phases
GitHub OAuth/repositories/PR diffs → static analyzers → Monaco diff viewer → GitHub comments/webhooks → auth/RBAC → analytics/history → hardening/tests.
