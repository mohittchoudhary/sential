"""
Update CAM-001 through CAM-006 with exact coordinates and locations in PostgreSQL.
"""
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

from app.database.connection import SessionLocal
from app.models.camera import Camera

EXACT_COORDINATES = {
    "CAM-001": {
        "location": "Chimanbhai Patel Bridge, Ahmedabad, Gujarat, India",
        "latitude": 23.069362,
        "longitude": 72.587224,
    },
    "CAM-002": {
        "location": "Janpath T Junction, Ahmedabad, Gujarat, India",
        "latitude": 23.02509,
        "longitude": 72.57094,
    },
    "CAM-003": {
        "location": "O.N.G.C. Office / Avani Bhavan, Chandkheda, Ahmedabad, Gujarat, India",
        "latitude": 23.10556,
        "longitude": 72.59734,
    },
    "CAM-004": {
        "location": "Paldi Circle, Ahmedabad, Gujarat, India",
        "latitude": 23.0134,
        "longitude": 72.5624,
    },
    "CAM-005": {
        "location": "Visat Teen Rasta, Ahmedabad, Gujarat, India",
        "latitude": 23.1027,
        "longitude": 72.5952,
    },
    "CAM-006": {
        "location": "Timbavadi Gate / Madhuram Bypass Road, Junagadh, Gujarat, India",
        "latitude": 21.5030,
        "longitude": 70.4300,
    },
}

def update_coordinates():
    db = SessionLocal()
    try:
        updated = []
        for code, data in EXACT_COORDINATES.items():
            cam = db.query(Camera).filter(Camera.camera_code == code).first()
            if cam:
                cam.location = data["location"]
                cam.latitude = data["latitude"]
                cam.longitude = data["longitude"]
                updated.append(code)
                print(f"Updated {code}: {cam.location} -> ({cam.latitude}, {cam.longitude})")
            else:
                print(f"Warning: {code} not found in database!")
        db.commit()
        print(f"Successfully committed updates for {len(updated)} cameras.")
    except Exception as e:
        db.rollback()
        print(f"Error updating coordinates: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_coordinates()
