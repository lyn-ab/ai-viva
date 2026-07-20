from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from lib.backend.routes.questions import router as questions_router

app = FastAPI(title="VivaAI Backend")

# Next.js dev server origin. Add your deployed frontend URL here too once
# you deploy (or read this from an env var).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions_router)


@app.get("/health")
def health():
    return {"status": "ok"}