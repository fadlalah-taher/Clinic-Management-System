# Clinic Management System

A full-stack **Clinic Management System** built with:
- **Backend**: Django + Django REST Framework (JWT authentication)
- **Frontend**: Angular 17 + Bootstrap 5

---

## Project Structure

```
Clinic-Management-System/
├── clinic-server/      ← Django backend
│   ├── clinic_project/ ← Django project settings & URLs
│   ├── clinic/         ← Main app (models, views, serializers)
│   ├── manage.py
│   ├── seed.py
│   └── requirements.txt
│
└── clinic-web/         ← Angular frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── auth/         (login, register)
    │   │   │   ├── layout/       (sidebar, navbar)
    │   │   │   ├── dashboard/
    │   │   │   ├── doctors/      (list, form, detail)
    │   │   │   ├── patients/     (list, form, detail)
    │   │   │   ├── medications/  (list, form)
    │   │   │   └── appointments/ (list, form, detail)
    │   │   ├── guards/
    │   │   ├── interceptors/
    │   │   ├── models/
    │   │   └── services/
    │   └── environments/
    └── package.json
```

---

## Data Models

### Doctor
| Field | Type | Notes |
|-------|------|-------|
| id | PK (auto) | |
| name | CharField | |
| specialty | CharField | choices: cardiology, neurology... |
| email | **EmailField** | unique |
| phone | CharField | |
| profile_image | **ImageField** | uploaded to `doctors/images/` |
| cv_document | **FileField** (PDF) | uploaded to `doctors/cv/` |
| created_at | DateTimeField | auto |

### Patient
| Field | Type | Notes |
|-------|------|-------|
| id | PK (auto) | |
| name | CharField | |
| date_of_birth | **DateField** | |
| email | **EmailField** | unique |
| phone | CharField | |
| address | TextField | |
| profile_image | **ImageField** | |
| medical_report | **FileField** (PDF) | |
| created_at | DateTimeField | auto |

### Medication
| Field | Type | Notes |
|-------|------|-------|
| id | PK (auto) | |
| name | CharField | |
| dosage | CharField | |
| description | TextField | |

### Appointment
| Field | Type | Notes |
|-------|------|-------|
| id | PK (auto) | |
| patient | **ForeignKey** → Patient | on_delete=CASCADE |
| doctor | **ForeignKey** → Doctor | on_delete=CASCADE |
| medications | **ManyToManyField** → Medication | |
| date | **DateField** | |
| contact_email | **EmailField** | |
| reason | CharField | |
| status | CharField | scheduled / completed / cancelled |
| duration | PositiveIntegerField | max 180 min |
| is_first_visit | BooleanField | |
| symptoms | TextField | |
| notes | TextField | |

---

## Backend Setup (clinic-server)

```bash
cd clinic-server

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations
python manage.py migrate

# 4. Seed demo data (optional)
python seed.py

# 5. Start server
python manage.py runserver
```

The API will be available at **http://localhost:8000/api/**

### Key API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/register/` | Register user |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/doctors/` | List / create doctors |
| GET/PUT/DELETE | `/api/doctors/{id}/` | Detail / update / delete |
| GET | `/api/doctors/{id}/appointments/` | Doctor's appointments |
| GET/POST | `/api/patients/` | List / create patients |
| GET | `/api/patients/{id}/appointments/` | Patient's appointments |
| GET/POST | `/api/medications/` | List / create medications |
| GET/POST | `/api/appointments/` | List / create appointments |

### Filtering & Searching
- **Search**: `?search=term` — searches relevant text fields
- **Filter**: `?status=scheduled`, `?specialty=cardiology`, `?date_after=2026-01-01`
- **Ordering**: `?ordering=-date`, `?ordering=name`
- **Pagination**: `?page=2` (10 per page by default)

---

## Frontend Setup (clinic-web)

```bash
cd clinic-web

# 1. Install dependencies
npm install

# 2. Start development server
npm start
```

The Angular app will be available at **http://localhost:4200**

---

## Features

### Authentication
- JWT-based login/logout
- User registration with password confirmation validation
- Auth guard on all protected routes
- JWT interceptor adds `Authorization: Bearer <token>` to all API calls
- Auto-redirect to `/login` on 401

### Doctors
- List with photo, search by name/email/specialty, filter by specialty, sort
- Create/Edit form with **image upload** (preview) and **PDF CV upload**
- Detail page showing profile + linked appointments

### Patients
- List with photo, search, sort by name / date of birth
- Create/Edit form with image and **PDF medical report upload**
- Detail page with linked appointments

### Medications
- Card-based list view with search
- Create/Edit form

### Appointments
- Table list with multi-filter (status, date range, search), sort
- Create/Edit form using **Reactive Forms** with validators:
  - Required fields validation
  - Email validator (`Validators.email`)
  - Duration range validator (`min(5)`, `max(180)`)
  - Many-to-many medication selection via checkboxes
- Detail page showing linked Patient and Doctor cards (navigable links)

### Angular Concepts Used
- **Reactive Forms** with `FormBuilder`, `FormGroup`, `Validators`
- **Angular Routing** with `RouterModule`, `routerLink`, `ActivatedRoute`
- **HTTP Interceptor** for JWT token injection
- **Route Guards** (`CanActivate`) for protected routes
- **Services** with dependency injection for each entity
- **Template-driven** search/filter controls with `[(ngModel)]`
- **forkJoin** for parallel HTTP requests (appointment form dropdowns)
