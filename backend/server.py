from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Query, Response, Header
from fastapi.responses import Response as FastAPIResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr, BeforeValidator
from bson import ObjectId

# ---------- Config ----------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
APP_NAME = os.environ.get('APP_NAME', 'maintenance-report')

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------- Storage ----------
storage_key = None
def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------- Models ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ReportImage(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str
    label: Optional[str] = ""

class ReportCreate(BaseModel):
    tanggal: str  # YYYY-MM-DD
    shift: str  # "shift1" or "shift2"
    area: str
    line: Optional[str] = ""
    mesin: Optional[str] = ""
    jig: Optional[str] = ""
    deskripsi: Optional[str] = ""
    problems: List[str] = []
    activities: List[str] = []
    who: Optional[str] = ""
    time: Optional[str] = ""
    status: str  # selesai, pending, issue, progress
    catatan: Optional[str] = ""
    images: List[ReportImage] = []

class ReportUpdate(BaseModel):
    tanggal: Optional[str] = None
    shift: Optional[str] = None
    area: Optional[str] = None
    line: Optional[str] = None
    mesin: Optional[str] = None
    jig: Optional[str] = None
    deskripsi: Optional[str] = None
    problems: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    who: Optional[str] = None
    time: Optional[str] = None
    status: Optional[str] = None
    catatan: Optional[str] = None
    images: Optional[List[ReportImage]] = None

class Report(BaseModel):
    id: str
    tanggal: str
    shift: str
    area: str
    deskripsi: str
    status: str
    catatan: str
    images: List[ReportImage]
    created_by: str
    created_by_name: str
    created_at: str
    updated_at: str

# ---------- Seeding ----------
async def seed_users():
    seed_data = [
        {"email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"], "name": "Admin Maintenance", "role": "admin", "shift": "admin"},
        {"email": os.environ["SHIFT1_EMAIL"], "password": os.environ["SHIFT1_PASSWORD"], "name": "Operator Shift 1", "role": "operator", "shift": "shift1"},
        {"email": os.environ["SHIFT2_EMAIL"], "password": os.environ["SHIFT2_PASSWORD"], "name": "Operator Shift 2", "role": "operator", "shift": "shift2"},
    ]
    for s in seed_data:
        existing = await db.users.find_one({"email": s["email"].lower()})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": s["email"].lower(),
                "password_hash": hash_password(s["password"]),
                "name": s["name"],
                "role": s["role"],
                "shift": s["shift"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        elif not verify_password(s["password"], existing["password_hash"]):
            await db.users.update_one({"email": s["email"].lower()}, {"$set": {"password_hash": hash_password(s["password"])}})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.reports.create_index("tanggal")
    await db.reports.create_index("shift")
    await seed_users()
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ---------- Auth Endpoints ----------
@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    token = create_access_token(user["id"], user["email"], user["role"])
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"], "shift": user["shift"]}
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------- Upload ----------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG/PNG/WEBP.")
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['id']}/{file_id}.{ext}"
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 10MB")
    content_type = file.content_type or f"image/{ext}"
    result = put_object(path, data, content_type)
    file_doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    file_doc.pop("_id", None)
    return {"id": file_id, "storage_path": result["path"], "original_filename": file.filename, "content_type": content_type}

@api_router.get("/files/{file_id}")
async def download_file(file_id: str, auth: Optional[str] = Query(None), authorization: Optional[str] = Header(None)):
    # Manual auth (supports query param for <img>)
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    record = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    data, ct = get_object(record["storage_path"])
    return FastAPIResponse(content=data, media_type=record.get("content_type", ct))

# ---------- Report Endpoints ----------
def report_from_doc(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

@api_router.post("/reports")
async def create_report(payload: ReportCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "tanggal": payload.tanggal,
        "shift": payload.shift,
        "area": payload.area,
        "line": payload.line or "",
        "mesin": payload.mesin or "",
        "jig": payload.jig or "",
        "deskripsi": payload.deskripsi or "",
        "problems": payload.problems or [],
        "activities": payload.activities or [],
        "who": payload.who or "",
        "time": payload.time or "",
        "status": payload.status,
        "catatan": payload.catatan or "",
        "images": [img.model_dump() for img in payload.images],
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": now,
        "updated_at": now
    }
    await db.reports.insert_one(doc)
    return report_from_doc(doc)

@api_router.get("/reports")
async def list_reports(
    shift: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    filt = {}
    if shift and shift != "all":
        filt["shift"] = shift
    if status and status != "all":
        filt["status"] = status
    if date_from or date_to:
        rng = {}
        if date_from:
            rng["$gte"] = date_from
        if date_to:
            rng["$lte"] = date_to
        filt["tanggal"] = rng
    if q:
        filt["$or"] = [
            {"area": {"$regex": q, "$options": "i"}},
            {"deskripsi": {"$regex": q, "$options": "i"}},
            {"catatan": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.reports.find(filt).sort("tanggal", -1).sort("created_at", -1).to_list(1000)
    return [report_from_doc(d) for d in docs]

@api_router.get("/reports/stats")
async def stats(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total = await db.reports.count_documents({})
    today_count = await db.reports.count_documents({"tanggal": today})
    selesai = await db.reports.count_documents({"status": "selesai"})
    pending = await db.reports.count_documents({"status": "pending"})
    issue = await db.reports.count_documents({"status": "issue"})
    progress = await db.reports.count_documents({"status": "progress"})
    shift1 = await db.reports.count_documents({"shift": "shift1"})
    shift2 = await db.reports.count_documents({"shift": "shift2"})
    return {
        "total": total, "today": today_count,
        "selesai": selesai, "pending": pending, "issue": issue, "progress": progress,
        "shift1": shift1, "shift2": shift2
    }

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    doc = await db.reports.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return report_from_doc(doc)

@api_router.put("/reports/{report_id}")
async def update_report(report_id: str, payload: ReportUpdate, user: dict = Depends(get_current_user)):
    doc = await db.reports.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "images" in update_data:
        update_data["images"] = [img if isinstance(img, dict) else img.model_dump() for img in update_data["images"]]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    doc = await db.reports.find_one({"id": report_id})
    return report_from_doc(doc)

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, user: dict = Depends(get_current_user)):
    doc = await db.reports.find_one({"id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    if user["role"] != "admin" and doc["created_by"] != user["id"]:
        raise HTTPException(status_code=403, detail="Tidak diizinkan menghapus laporan orang lain")
    await db.reports.delete_one({"id": report_id})
    return {"ok": True}

@api_router.get("/")
async def root():
    return {"message": "Maintenance Report API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
