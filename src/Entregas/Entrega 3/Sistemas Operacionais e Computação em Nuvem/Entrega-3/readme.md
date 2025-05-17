# 🧠 Feedback360 - Análise de Soft Skills

ENTREGA - 3 Sistemas operacionais e Computação em Nuvem

Este é um sistema simples de **Feedback 360°**, onde membros de uma equipe avaliam uns aos outros com foco em **soft skills** como comunicação, liderança, empatia e trabalho em equipe.

Os dados são armazenados em um banco de dados PostgreSQL, contêinerizado com Docker, e apresentados com um parecer automático.

---

## 🚀 Tecnologias utilizadas

- 🐍 Python 3.11
- 🔥 Flask
- 🐘 PostgreSQL
- 🐳 Docker e Docker Compose
- 📄 HTML (formulário via Jinja2)

---

## 📦 Funcionalidades

- Formulário web para coletar feedback
- Salvamento dos dados no PostgreSQL
- Análise automática com média e parecer por desempenho
- Interface de relatório simples e clara
- Totalmente contêinerizado com Docker

---

## 🧱 Estrutura do Projeto

├── app/
│ ├── init.py
│ ├── models.py
│ ├── routes.py
│ └── templates/
│ ├── index.html
│ └── report.html
├── run.py
├── Dockerfile
├── requirements.txt
├── docker-compose.yml

## 🐳 Como rodar o projeto com Docker

> Certifique-se de ter o Docker e o Docker Compose instalados.

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/feedback360.git
cd feedback360

Subir Programa
docker-compose up --build

Acesse no navegador
http://localhost:5000
