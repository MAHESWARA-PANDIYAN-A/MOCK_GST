import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="1234",
        host="localhost",
        port=5432
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'mock_gst'")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE mock_gst")
        print("Created database mock_gst successfully!")
    else:
        print("Database mock_gst already exists.")
    cur.close()
    conn.close()
    print("PostgreSQL connection confirmed.")
except Exception as e:
    print(f"Error: {e}")
