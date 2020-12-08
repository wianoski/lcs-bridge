from tkinter import *
from tkinter import ttk
from tkinter.filedialog import askopenfilename
from pandas import DataFrame
import matplotlib.pyplot as plt
from datetime import datetime
import numpy as np
import math

GUI = Tk()
GUI.geometry("500x200")
GUI.title("SIMBAGAS Sensor Visualizer")


def OpenFile():
    fileName = askopenfilename(
        filetypes=(("Sensor Data", "*.csv"), ("All Files", "*.*")),
        title="Choose a file."
    )
    with open(fileName) as fileData:
        fileNameFull = fileName.split('/')
        if len(fileNameFull) > 1:
            arguments = fileNameFull[len(fileNameFull) - 1].split('-')
            if int(arguments[0]) == 1:
                X, Y, timestamps = [], [], []
                for row in fileData:
                    rawData = row.replace('\n', '').split(',')
                    timestamp = int(rawData.pop(0))
                    for index in range(len(rawData)):
                        if int(index) % 2 == 0:
                            X.append((float(rawData[index])*0.02)+0)
                        else:
                            Y.append((float(rawData[index])*0.02)+0)
                            timestamps.append(
                                datetime.fromtimestamp(timestamp/1000.0))
                            timestamp += 20
                df = DataFrame({
                    'Time': timestamps,
                    'Vertikal': Y,
                    'Lintang': X
                })

                df.plot(x='Time', subplots=True, layout=(2, 1), sharey=True)
                plt.title(arguments[2].replace('_', ' ').replace('.csv', ''))
                # plt.gca().xaxis_date('Asia/Jakarta')

                # XData = np.array(df['Vertikal'])
                # YData = np.array(df['Lintang'])

                # XOutput = np.fft.fft(XData)
                # YOutput = np.fft.fft(YData)

                # fa = 1.0/0.02
                # N = math.ceil(len(XOutput)/2)
                # frequency = np.linspace(0, fa/2, N)[1:]

                # XOutput_real = np.abs(XOutput[1:N])
                # YOutput_real = np.abs(YOutput[1:N])
                # XMax = np.amax(XOutput_real)
                # YMax = np.amax(YOutput_real)

                # df = DataFrame({
                #     'Frequency': frequency,
                #     'X (Max value = ' + str(round(XMax, 3)) + ')': XOutput_real,
                #     'Y (Max Value = ' + str(round(YMax, 3)) + ')': YOutput_real
                # }).sort_values(by=['Frequency'])

                # df.plot(x='Frequency', subplots=True,
                #         layout=(2, 1), sharey=True)
                # plt.title('analisis getaran dari ' + arguments[2].replace('_', ' ').replace('.csv', ''))
                plt.show()
            else:
                Y, timestamps = [], []
                for row in fileData:
                    rawData = row.replace('\n', '').split(',')
                    timestamp = int(rawData.pop(0))
                    Y.append(float(rawData[0]))
                    timestamps.append(datetime.fromtimestamp(timestamp/1000.0))
                df = DataFrame({
                    'Time': timestamps,
                    'Nilai Sensor': Y
                })
                df.plot(x='Time')
                plt.title(arguments[2].replace('_', ' ').replace('.csv', ''))
                plt.show()
        else:
            pass

label = ttk.Label(
    GUI, text="Pastikan anda tidak mengubah format file dataset", font=("", 12))
label.pack()

menu = Menu(GUI)
button = Button(text="Pilih Dataset", command=OpenFile)
button.pack()
GUI.config(menu=menu)

GUI.mainloop()