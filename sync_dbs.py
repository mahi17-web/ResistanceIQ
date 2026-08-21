import shutil
import os

src = os.path.abspath("resistanceiq/backend/resistanceiq_dev.db")
dest1 = os.path.abspath("resistanceiq_dev.db")
dest2 = os.path.abspath("resistanceiq/resistanceiq_dev.db")

if os.path.exists(src):
    print(f"Syncing DB from {src} to {dest1} and {dest2}")
    shutil.copy2(src, dest1)
    shutil.copy2(src, dest2)
    print("Database sync complete.")
