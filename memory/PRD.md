# PRD — Sankei Maintenance Daily Report

## Original Problem Statement
Saya mau membuat web untuk record daily report Maintenance, kemudian bisa di show seperti ppt, per report, bisa add gambar dan ada fungsi filter, search, usernya ada 2, shift 1 dan Shift 2.

## User Personas
- **Admin** (maintenancesankeidharma@gmail.com) — melihat & kelola semua report
- **Shift 1 Operator** — catat & kelola report shift pagi (07:00-15:00)
- **Shift 2 Operator** — catat & kelola report shift malam (15:00-23:00)

## Core Requirements (static)
- Login dengan preseeded users (admin, shift1, shift2)
- CRUD Daily Report (Tanggal, Shift, Area, Deskripsi, Status, Gambar, Catatan)
- Upload multiple foto per report via Object Storage
- Filter (shift, status, tanggal) + Search (area/deskripsi/catatan)
- Mode Presentasi slideshow seperti PPT dengan next/prev, autoplay, fullscreen
- UI Bahasa Indonesia, tema industrial dark slate + amber

## Implemented (2026-02)
- FastAPI backend: JWT auth (7 hari), Reports CRUD, Upload via Emergent Object Storage, Files serve dengan ?auth= param
- React frontend: Login (quick-fill), Dashboard (KPI + Grid + Filter), Form (create/edit + upload), Detail (lightbox), Presentation mode (keyboard nav, autoplay, filmstrip)
- 3 preseeded accounts, RBAC (admin bisa hapus semua, operator hanya miliknya)
- Testing agent iteration 1: 100% pass (backend & frontend)

## Backlog
### P1
- Export laporan ke PDF/PPT sungguhan
- Signature/paraf digital operator saat serah terima
- Auto-generate laporan mingguan/bulanan
### P2
- Push notification Pending → Shift berikutnya
- Chart trend downtime & area terkritis
- Attachment non-gambar (PDF SOP, laporan lab)
