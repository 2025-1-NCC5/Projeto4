import numpy as np
import matplotlib.pyplot as plt

# ---------------------------
# 1. Dados da Entrega 1
# ---------------------------

dados = np.array([
    [25, 5, 0],
    [40, 20, 1],
    [30, 10, 0],
    [22, 2, 2],
    [35, 15, 1]
])

print("Matriz original de dados:")
print("Idade | Tempo de Habilitação | Nº de Sinistros")
print(dados)

# ---------------------------
# 2. Centralização dos Dados
# ---------------------------

media = np.mean(dados, axis=0)
dados_centralizados = dados - media
print("\nMédia de cada coluna (para centralizar):")
print(media)

print("\nMatriz de dados centralizada:")
print(dados_centralizados)

# ---------------------------
# 3. Matriz de Covariância
# ---------------------------
matriz_cov = np.cov(dados_centralizados.T)
print("\nMatriz de Covariância:")
print(matriz_cov)

# ---------------------------
# 4. Autovalores e Autovetores
# ---------------------------

autovalores, autovetores = np.linalg.eig(matriz_cov)

print("\nAutovalores:")
print(autovalores)

print("\nAutovetores:")
print(autovetores)

# ---------------------------
# 5. Visualização dos Autovalores
# ---------------------------

plt.figure(figsize=(8, 4))
plt.bar(range(1, len(autovalores) + 1), autovalores)
plt.title('Autovalores da Matriz de Covariância')
plt.xlabel('Componente Principal')
plt.ylabel('Valor (Variância Explicada)')
plt.grid(True)
plt.tight_layout()
plt.show()

# ---------------------------
# 6. Projeção PCA 2D
# ---------------------------

componentes_principais = autovetores[:, :2]  # Pegando os 2 primeiros autovetores
dados_projetados = dados_centralizados.dot(componentes_principais)

# ---------------------------
# 7. Visualização da Projeção PCA
# ---------------------------

plt.figure(figsize=(6, 6))
plt.scatter(dados_projetados[:, 0], dados_projetados[:, 1], color='blue', edgecolors='k')
for i in range(len(dados)):
    plt.text(dados_projetados[i, 0]+0.2, dados_projetados[i, 1], f'C{i+1}')
plt.title('Projeção dos Dados nos 2 Componentes Principais (PCA)')
plt.xlabel('Componente Principal 1')
plt.ylabel('Componente Principal 2')
plt.grid(True)
plt.axhline(0, color='gray', linestyle='--', linewidth=0.5)
plt.axvline(0, color='gray', linestyle='--', linewidth=0.5)
plt.tight_layout()
plt.show()
