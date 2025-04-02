import pandas as pd

tabela1 = pd.read_csv('./data/rideaddress_v1.csv', sep=';')
tabela2 = pd.read_csv('./data/ride_v2.csv', sep=';')
tabela3 = pd.read_csv('./data/rideestimative_v3.csv', sep=';')
tabela4 = pd.read_csv('./data/product.csv', sep=';')

print(tabela1.head())