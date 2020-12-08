import pandas as pd
df = pd.read_csv('pls_strain.csv')
df1 = pd.read_csv('pusjatan_fix.csv')
# df.plot()
# df.plot(y='pitch')


print(df)
df['uS'] = (df['uS'] - 62.5) * 200

print(len(df))
print(len(df1))
df.plot(x='timestamp')
# # conv.plot(x=df['timestamp'])
# print(conv)
# # data.set_xlabel("timestamp")

df1.plot(x='timestamp')
