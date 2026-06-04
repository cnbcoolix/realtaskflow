from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# This creates (or opens) a local SQLite file called taskflow.db
engine = create_engine("sqlite:///./taskflow.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# This is the users table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# This is the tasks table
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    description = Column(Text, default="")
    status = Column(String, default="todo")        # todo / in_progress / done
    priority = Column(String, default="medium")    # high / medium / low
    estimated_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create the tables in the database file
Base.metadata.create_all(bind=engine)

# This function gives us a database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()