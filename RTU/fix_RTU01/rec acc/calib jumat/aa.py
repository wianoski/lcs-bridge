import pandas as pd
df = pd.read_csv('pls_strain.csv')
df1 = pd.read_csv('pusjatan_fix.csv')
# df.plot(y='pitch')

conv = (df['uS'] * 2)+0
data = conv.plot(x=df['timestamp'])
data.set_xlabel("timestamp")

data1 = df1.plot(x='timestamp')