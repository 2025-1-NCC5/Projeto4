from flask import Blueprint, render_template, request
from app.models import Feedback
from app import db

bp = Blueprint("main", __name__)

@bp.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@bp.route("/submit", methods=["POST"])
def submit():
    try:
        print("🔄 Recebendo dados do formulário...")

        data = Feedback(
            evaluator=request.form["evaluator"],
            evaluated=request.form["evaluated"],
            communication=int(request.form["communication"]),
            leadership=int(request.form["leadership"]),
            empathy=int(request.form["empathy"]),
            teamwork=int(request.form["teamwork"]),
            comments=request.form["comments"]
        )

        print("📝 Dados recebidos:", data.__dict__)

        db.session.add(data)
        db.session.commit()

        print("✅ Feedback salvo com sucesso!")

        feedback_summary = analyze_feedback(data)
        return render_template("report.html", result=feedback_summary)

    except Exception as e:
        print("❌ ERRO AO SALVAR:", e)
        return "Erro ao salvar o feedback", 500

def analyze_feedback(data):
    scores = [data.communication, data.leadership, data.empathy, data.teamwork]
    average = sum(scores) / len(scores)

    if average >= 4.5:
        level = "Excelente desempenho em soft skills!"
    elif average >= 3.5:
        level = "Bom desempenho, mas há espaço para crescimento."
    elif average >= 2.5:
        level = "Atenção: soft skills precisam de desenvolvimento."
    else:
        level = "Desempenho preocupante. Requer acompanhamento próximo."

    return {
        "name": data.evaluated,
        "average": round(average, 2),
        "level": level,
        "scores": {
            "comunicacao": data.communication,
            "lideranca": data.leadership,
            "empatia": data.empathy,
            "trabalho_em_equipe": data.teamwork
        },
        "comments": data.comments
    }
