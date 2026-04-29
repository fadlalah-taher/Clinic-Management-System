export interface Doctor {
  id?: number;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  profile_image?: string | null;
  cv_document?: string | null;
  profile_image_url?: string;
  cv_document_url?: string;
  created_at?: string;
}

export interface Patient {
  id?: string;          // MongoDB ObjectId string
  name: string;
  date_of_birth: string;
  email: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  health_book?: string;
  profile_image_url?: string;
  health_book_url?: string;
  medical_report_url?: string;
  created_at?: string;
}

export interface Medication {
  id?: number;
  name: string;
  dosage: string;
  description?: string;
  created_at?: string;
}

export interface Appointment {
  id?: string;            // MongoDB ObjectId string
  patient_id?: string;    // MongoDB ObjectId string
  doctor_id?: number;     // SQL Doctor id
  medication_ids?: number[];
  date: string;
  contact_email: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration: number;
  is_first_visit: boolean;
  symptoms?: string;
  notes?: string;
  created_at?: string;
  // nested detail objects (read-only, enriched by backend)
  patient_detail?: Patient;
  doctor_detail?: Doctor;
  medications_detail?: Medication[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: 'doctor' | 'patient' | 'admin';
  // Doctor-specific
  doctor_id?: number;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_phone?: string;
  doctor_email?: string;
  // Patient-specific
  patient_mongo_id?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_address?: string;
  patient_dob?: string;
  // Shared file URLs
  profile_image_url?: string;
  cv_document_url?: string;
  health_book_url?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

