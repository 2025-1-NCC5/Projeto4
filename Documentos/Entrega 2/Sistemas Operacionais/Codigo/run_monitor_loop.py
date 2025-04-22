# run_monitor_loop.py
import subprocess
import time
import os

# Caminho para o interpretador Python dentro do venv
PYTHON_EXEC = '/home/lucca/projeto/venv/bin/python'
# Caminho para o script de monitoramento
MONITOR_SCRIPT = '/home/lucca/projeto/monitor.py'
# Intervalo de coleta em segundos
INTERVAL = 5 # Colete a cada 5 segundos

# Nome do arquivo de log de recursos
LOG_FILE = '/home/lucca/projeto/resource_log.csv'

def clear_log_file():
    """Limpa o arquivo de log se ele existir."""
    if os.path.exists(LOG_FILE):
        print(f"Limpando arquivo de log existente: {LOG_FILE}")
        open(LOG_FILE, 'w').close() # Abre em modo escrita e fecha, truncando o arquivo

if __name__ == "__main__":
    clear_log_file() # Garante que começamos com um log limpo para esta execução
    print(f"Iniciando monitoramento a cada {INTERVAL} segundos...")
    print("Pressione Ctrl+C para parar o monitoramento.")
    try:
        while True:
            # Executa o monitor.py usando o Python do venv
            subprocess.run([PYTHON_EXEC, MONITOR_SCRIPT], check=True)
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print("\nMonitoramento interrompido pelo usuário.")
    except Exception as e:
        print(f"\nErro durante o monitoramento: {e}")