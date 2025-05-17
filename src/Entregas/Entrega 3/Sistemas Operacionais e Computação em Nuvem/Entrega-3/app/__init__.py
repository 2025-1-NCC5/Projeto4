from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    from app.routes import bp  # IMPORTAR AQUI, DEPOIS DO db SER DEFINIDO

    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/feedbackdb")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    app.register_blueprint(bp)

    with app.app_context():
        from app.models import Feedback  # Importar AQUI para evitar ciclo
        db.create_all()

    return app
