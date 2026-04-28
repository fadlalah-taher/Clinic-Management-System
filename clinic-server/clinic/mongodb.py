"""
MongoDB connection module (PyMongo – Method 3 Hybrid).
SQL (SQLite) handles Doctor, Medication, User/Auth.
MongoDB handles Patient and Appointment collections.
"""
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["clinic_db"]

patients_collection = db["patients"]
appointments_collection = db["appointments"]
