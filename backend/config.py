import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

DATABASE_PATH = os.path.join(DATA_DIR, 'pymkui.db')
