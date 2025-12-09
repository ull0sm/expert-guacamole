
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import glob
import base64
import time
from deepface import DeepFace
from supabase import create_client, Client
from dotenv import load_dotenv
import shutil

# Load env vars
load_dotenv()

app = Flask(__name__)
CORS(app)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment!")

try:
    supabase: Client = create_client(url, key)
    print("Supabase client initialized.")
except Exception as e:
    print(f"Failed to init Supabase: {e}")

FACES_DIR = "faces"
if not os.path.exists(FACES_DIR):
    os.makedirs(FACES_DIR)

@app.route("/sync", methods=["POST"])
def sync_faces():
    """
    Downloads faces and ensures they are in a standard format (JPG) for DeepFace.
    Parses USN from filenames like "USN-TIMESTAMP.jpg".
    Prunes local folders that are no longer in the bucket.
    """
    print("Starting Sync Process...")
    try:
        files = supabase.storage.from_("face-images").list()
        
        current_usns = set()

        if files:
            synced_count = 0
            for file_obj in files:
                file_name = file_obj.get('name')
                if not file_name or file_name == ".emptyFolderPlaceholder": 
                    continue
                
                # Parsing Logic
                base_name = os.path.splitext(file_name)[0]
                parts = base_name.split('-')
                
                real_usn = base_name 
                if len(parts) > 1:
                    last_part = parts[-1]
                    if last_part.isdigit() and len(last_part) > 8: 
                        real_usn = "-".join(parts[:-1]) 
                    else:
                        real_usn = base_name 

                current_usns.add(real_usn)
                
                student_dir = os.path.join(FACES_DIR, real_usn)
                
                # Check if we need to update/download
                # Simple strategy: If dir exists and has files, assume synced unless we force clear.
                # For robust sync we can just overwrite if size diff, but for now let's just ensure existence.
                # User asked to be consistent. Safest is to overwrite if we want to support image updates.
                
                if os.path.exists(student_dir):
                    # Check if file exists inside
                    local_file = os.path.join(student_dir, f"{real_usn}.jpg")
                    if os.path.exists(local_file):
                         # Optional: Skip download if exists to save bandwidth
                         # But user said "consistency", so if they changed photo, we must re-download.
                         pass
                else:
                    os.makedirs(student_dir)
                
                local_path = os.path.join(student_dir, f"{real_usn}.jpg")
                
                # Always download to ensure latest version
                # print(f"Downloading {file_name} -> {local_path}...")
                data = supabase.storage.from_("face-images").download(file_name)
                with open(local_path, 'wb+') as f:
                    f.write(data)
                synced_count += 1
        
        # --- PRUNING OLD FOLDERS ---
        # Walk through FACES_DIR and remove any folder that isn't in current_usns
        print("Pruning old data...")
        deleted_count = 0
        local_folders = [f for f in os.listdir(FACES_DIR) if os.path.isdir(os.path.join(FACES_DIR, f))]
        
        for folder in local_folders:
            if folder not in current_usns and folder != ".deepface": # Avoid deleting deepface cache dir if inside
                print(f"Removing obsolete student data: {folder}")
                shutil.rmtree(os.path.join(FACES_DIR, folder))
                deleted_count += 1

        # Clear old representations to force rebuild
        # Clear old representations to force rebuild
        # Remove both old style (representations_*) and new style (ds_model_*) pickle files
        print("Clearing DeepFace cache files...")
        for pkl_file in glob.glob(os.path.join(FACES_DIR, "*.pkl")):
            try:
                os.remove(pkl_file)
                print(f" - Deleted cache: {os.path.basename(pkl_file)}")
            except Exception as e:
                print(f" - Failed to delete {os.path.basename(pkl_file)}: {e}")

        print(f"Sync complete. Updated {len(current_usns)} faces. Deleted {deleted_count} old records.")
        return jsonify({
            "message": f"Sync Complete. Active: {len(current_usns)}, Pruned: {deleted_count}", 
            "total_files": len(files) if files else 0
        })
        
    except Exception as e:
        print(f"CRITICAL SYNC ERROR: {e}")
        return jsonify({"message": "Sync failed", "error": str(e)}), 500

@app.route("/recognize", methods=["POST"])
def recognize():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
             return jsonify({"error": "No image provided"}), 400

        # Decode Image
        image_data = data["image"].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        recognized_students = []

        if not os.listdir(FACES_DIR):
             return jsonify([])

        # Run Recognition
        dfs = DeepFace.find(img_path=frame_bgr, 
                          db_path=FACES_DIR, 
                          model_name="VGG-Face", 
                          detector_backend="opencv", 
                          enforce_detection=False, 
                          silent=True,
                          threshold=0.6)
        
        if len(dfs) > 0:
            for df in dfs:
                if not df.empty:
                    best_match = df.iloc[0]
                    identity_path = best_match['identity'] 
                    distance = best_match['distance']
                    
                    normalized = identity_path.replace('\\', '/')
                    parts = normalized.split('/')
                    
                    if len(parts) >= 2:
                        usn = parts[-2]
                        recognized_students.append({'usn': usn, 'confidence': float(distance)})
                        print(f"MATCH: {usn} (Dist: {distance:.4f})")

        return jsonify(recognized_students)

    except Exception as e:
        print(f"Recognition Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


def warmup():
    """
    Forces DeepFace to build the representations cache file (.pkl) on startup.
    This prevents race conditions where multiple requests try to write the file simultaneously.
    """
    print("--- WARMING UP FACE MODEL ---")
    
    # Safety: Clean up existing cache files to prevent permission errors
    # This ensures we start with a fresh writeable cache
    for pkl in glob.glob(os.path.join(FACES_DIR, "ds_model_*.pkl")):
        try:
            os.remove(pkl)
            print(f"Startup clean: Removed {os.path.basename(pkl)}")
        except Exception as e:
            print(f"Startup clean warn: Could not remove {os.path.basename(pkl)} - {e}")
    try:
        if not os.path.exists(FACES_DIR) or not os.listdir(FACES_DIR):
            print("No faces found to warm up with. Skipping.")
            return

        # Find first available image
        sample_img = None
        for root, dirs, files in os.walk(FACES_DIR):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    sample_img = os.path.join(root, file)
                    break
            if sample_img: break
        
        if sample_img:
            print(f"Running warmup on {sample_img}...")
            # Run find once to trigger pickle generation
            DeepFace.find(img_path=sample_img, 
                          db_path=FACES_DIR, 
                          model_name="VGG-Face", 
                          detector_backend="opencv", 
                          enforce_detection=False, 
                          silent=True)
            print("--- WARMUP COMPLETE: Model cache generated safely ---")
        else:
            print("No suitable images found for warmup.")

    except Exception as e:
        print(f"Warmup warning: {e}")

if __name__ == "__main__":
    warmup()
    app.run(port=5006, debug=True, use_reloader=False)
