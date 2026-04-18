# pip install psycopg2-binary python-dotenv
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Database connection details
conn = psycopg2.connect(
    host=os.environ["DB_HOST"],
    port=int(os.environ.get("DB_PORT", 5432)),
    dbname=os.environ.get("DB_NAME", "defaultdb"),
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    sslmode="require"
)

# Query to count users
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM users")
user_count = cursor.fetchone()[0]

print(f"Total registered users: {user_count}")

cursor.close()
conn.close()