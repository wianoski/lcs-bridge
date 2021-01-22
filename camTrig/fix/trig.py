import cv2
import numpy as np
import time
import datetime
# import paho.mqtt.client as mqtt
import sys
import os
from PIL import Image


camera = cv2.VideoCapture("rtsp://admin:admin123@192.168.0.114:554/cam/realmonitor?channel=1&subtype=0")
time = int(time.time()) 
# st = datetime.datetime.now()
# timestr = time.strftime("%Y-%m-%d %H:%M:%S")

def saveJpgImage(frame):
    #process image
    img_name = '{}.jpg'.format(time)
    cv2.imwrite(img_name, frame)

   



def main():
    while(True):
        ret, frame = camera.read()
        saveJpgImage(frame)
        # upload()
        break




if __name__ == '__main__':
    main()