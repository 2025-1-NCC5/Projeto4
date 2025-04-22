# analyze.py
import pandas as pd
from sklearn.ensemble import IsolationForest
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# Caminhos absolutos
PROJECT_DIR = '/home/lucca/projeto'
LOG_FILE = os.path.join(PROJECT_DIR, 'resource_log.csv')
OUTPUT_GRAPH = os.path.join(PROJECT_DIR, 'resource_monitoring_anomalies.png')

def load_data(file_path):
    """Carrega os dados do arquivo CSV usando pandas."""
    try:
        # Verifica se o arquivo existe e não está vazio antes de tentar ler
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
             print(f"Aviso: Arquivo {file_path} não existe ou está vazio.")
             return None
        df = pd.read_csv(file_path)
        if df.empty:
             print(f"Aviso: Arquivo {file_path} está vazio após leitura.")
             return None
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        print(f"Dados carregados com sucesso de {file_path}. {len(df)} registros encontrados.")
        return df
    except FileNotFoundError:
        print(f"Erro: Arquivo {file_path} não encontrado.")
        return None
    except pd.errors.EmptyDataError:
         print(f"Erro: Nenhuma coluna para analisar no arquivo {file_path}. Está vazio ou mal formatado?")
         return None
    except Exception as e:
        print(f"Erro ao carregar ou processar o arquivo CSV: {e}")
        return None

def detect_anomalies(df, features=['cpu_percent', 'memory_percent'], contamination=0.05):
    """Detecta anomalias usando Isolation Forest."""
    if df is None or df.empty:
        print("DataFrame vazio ou inválido. Não é possível detectar anomalias.")
        # Retorna um DataFrame vazio com a coluna 'anomaly_flag' para evitar erros posteriores
        return pd.DataFrame(columns=features + ['anomaly_flag'])

    if not all(feature in df.columns for feature in features):
        print(f"Erro: Nem todas as features {features} estão presentes no DataFrame.")
        missing = [f for f in features if f not in df.columns]
        print(f"Features ausentes: {missing}")
        # Retorna um DataFrame vazio com a coluna 'anomaly_flag'
        return pd.DataFrame(columns=features + ['anomaly_flag'])

    X = df[features]

    if len(X) < 2:
        print("Dados insuficientes para treinar o modelo de detecção de anomalias.")
        df['anomaly_flag'] = 0 # Marca tudo como não anômalo
        return df

    model = IsolationForest(n_estimators=100, contamination=contamination, random_state=42)
    # Usar fit_predict é mais direto para obter as predições (-1 ou 1)
    df['anomaly'] = model.fit_predict(X)
    df['anomaly_flag'] = df['anomaly'].apply(lambda x: 1 if x == -1 else 0)

    num_anomalies = df['anomaly_flag'].sum()
    print(f"Detecção de anomalias concluída. {num_anomalies} anomalias encontradas.")
    return df

def plot_data_with_anomalies(df, output_file):
    """Gera gráficos de uso de recursos destacando as anomalias."""
    # Verifica se df existe, não está vazio E se tem a coluna anomaly_flag
    if df is None or df.empty or 'anomaly_flag' not in df.columns:
        print("Não é possível gerar gráficos. DataFrame inválido ou sem dados/anomalias.")
        return

    anomalies = df[df['anomaly_flag'] == 1]

    fig, axes = plt.subplots(2, 1, figsize=(15, 10), sharex=True)
    fig.suptitle('Monitoramento de Recursos Durante Execução do Notebook (Anomalias com Isolation Forest)')

    # Gráfico de CPU
    axes[0].plot(df.index, df['cpu_percent'], label='Uso de CPU (%)', color='blue', zorder=1, alpha=0.7)
    if not anomalies.empty: # Só plota anomalias se existirem
         axes[0].scatter(anomalies.index, anomalies['cpu_percent'], color='red', label='Anomalia Detectada', marker='x', s=50, zorder=2)
    axes[0].set_ylabel('CPU (%)')
    axes[0].legend()
    axes[0].grid(True)
    axes[0].set_title('Uso de CPU ao Longo do Tempo')

    # Gráfico de Memória
    axes[1].plot(df.index, df['memory_percent'], label='Uso de Memória (%)', color='green', zorder=1, alpha=0.7)
    if not anomalies.empty:
         axes[1].scatter(anomalies.index, anomalies['memory_percent'], color='red', label='Anomalia Detectada', marker='x', s=50, zorder=2)
    axes[1].set_ylabel('Memória (%)')
    axes[1].legend()
    axes[1].grid(True)
    axes[1].set_title('Uso de Memória ao Longo do Tempo')

    plt.xlabel('Data e Hora')
    fig.autofmt_xdate()
    axes[1].xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M:%S')) # Adicionar segundos para mais granularidade

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])

    try:
        plt.savefig(output_file)
        print(f"Gráfico salvo como '{output_file}'")
    except Exception as e:
        print(f"Erro ao salvar o gráfico: {e}")

if __name__ == "__main__":
    # 1. Carregar os dados
    data_df = load_data(LOG_FILE)

    # 2. Detectar anomalias
    data_df_anomalies = detect_anomalies(data_df, features=['cpu_percent', 'memory_percent'], contamination=0.03) # Ajuste contamination se necessário

    # 3. Gerar e salvar os gráficos
    plot_data_with_anomalies(data_df_anomalies, OUTPUT_GRAPH)