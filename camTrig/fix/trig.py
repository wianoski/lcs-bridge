import cv2
import numpy as np
import time
import datetime
import paho.mqtt.client as mqtt
import sys
import os

from google.cloud import storage
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import storage


cred = credentials.Certificate('env.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'bridge-monitoring-app.appspot.com'
})



camera = cv2.VideoCapture("rtsp://admin:admin123@192.168.0.114:554/cam/realmonitor?channel=1&subtype=0")
time = int(time.time()) 
# st = datetime.datetime.now()
# timestr = time.strftime("%Y-%m-%d %H:%M:%S")

def saveJpgImage(frame):
    #process image
    img_name = '{}.jpg'.format(time)
    cv2.imwrite(img_name, frame)

    bucket = storage.bucket()
    blob = bucket.blob(img_name)
    outfile=img_name
    blob.upload_from_filename(outfile)
    
    # bucket = storage.bucket()
    # blob = bucket.blob(img_name)
    # outfile=img_name
    # blob.upload_from_filename(outfile)

    # client = storage.Client()
    # bucket = client.get_bucket('bridge-monitoring-app.appspot.com')
    # # posting to firebase storage
    # imageBlob = bucket.blob("/")
    # # imagePath = [os.path.join(self.path,f) for f in os.listdir(self.path)]
    # imagePath = "img_name"
    # imageBlob = bucket.blob("img_name")
    # imageBlob.upload_from_filename(img_name)




def main():
    while(True):
        ret, frame = camera.read()
        saveJpgImage(frame)
        # upload()
        break




if __name__ == '__main__':
    main()