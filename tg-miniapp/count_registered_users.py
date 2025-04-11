# pip install psycopg2-binary
import psycopg2

# Database connection details
conn = psycopg2.connect(
    host="tg-miniapp-tg-miniapp.c.aivencloud.com",
    port=12753,
    dbname="defaultdb",
    user="avnadmin",
    password="AVNS_rImoQUP-lVSms49PwvV",
    sslmode="require"
)

# Query to count users
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM users")
user_count = cursor.fetchone()[0]

print(f"Total registered users: {user_count}")

cursor.close()
conn.close()