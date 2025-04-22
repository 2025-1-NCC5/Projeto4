# monitor.py
import psutil
import csv
import os
import datetime
import time

LOG_FILE = '/home/lucca/projeto/resource_log.csv' # Caminho absoluto é mais seguro
CSV_HEADER = ['timestamp', 'cpu_percent', 'memory_percent', 'disk_percent_root']

def get_resource_usage():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    timestamp = datetime.datetime.now().isoformat()
    return timestamp, cpu, memory, disk

def log_data(data):
    file_exists = os.path.isfile(LOG_FILE)
    # Usar 'a' (append) para adicionar linhas
    with open(LOG_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        # Escreve o cabeçalho APENAS se o arquivo não existir OU estiver vazio
        if not file_exists or os.path.getsize(LOG_FILE) == 0:
            writer.writerow(CSV_HEADER)
        writer.writerow(data)

if __name__ == "__main__":
    try:
        current_data = get_resource_usage()
        log_data(current_data)
        # Remover prints para não poluir logs, ou redirecionar se precisar depurar
        # print(f"Dados coletados: {current_data}")
    except Exception as e:
        # É melhor logar erros em um arquivo separado em produção
        print(f"Erro ao coletar ou salvar dados: {e}")