from flask_sqlalchemy import SQLAlchemy
from app import db

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    evaluator = db.Column(db.String(100), nullable=False)
    evaluated = db.Column(db.String(100), nullable=False)
    communication = db.Column(db.Integer, nullable=False)
    leadership = db.Column(db.Integer, nullable=False)
    empathy = db.Column(db.Integer, nullable=False)
    teamwork = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text)
