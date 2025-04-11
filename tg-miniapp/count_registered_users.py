# pip install psycopg2-binary
import psycopg2

# Database connection details
conn = psycopg2.connect(
    host="<HOST_REDACTED>",
    port=12753,
    dbname="defaultdb",
    user="<USER_REDACTED>",
    password="<REDACTED>",
    sslmode="require"
)

# Query to count users
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM users")
user_count = cursor.fetchone()[0]

print(f"Total registered users: {user_count}")

cursor.close()
conn.close()