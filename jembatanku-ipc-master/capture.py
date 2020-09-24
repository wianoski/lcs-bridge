import cv2
import sys
import os
import time
import glob
from uuid import uuid4

from google.cloud import storage
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import storage

cred = credentials.Certificate('capture.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'bridge-monitoring-app.appspot.com'
})

bridgeId = sys.argv[1]
fileName = sys.argv[2] + '.jpeg'
filePath = str(bridgeId) + '/snapshot/' + str(sys.argv[2])

if __name__ == '__main__':
    camera = cv2.VideoCapture(
        "rtsp://admin:admin123@192.168.0.114:554/cam/realmonitor?channel=1&subtype=0")
    ret, frame = camera.read()
    cv2.imwrite(fileName, frame)
    bucket = storage.bucket()
    blob = bucket.blob(filePath)
    metadata = {"firebaseStorageDownloadTokens": uuid4()}
    blob.metadata = metadata
    blob.upload_from_filename(filename=fileName, content_type='image/jpeg')
    os.remove(fileName)
    print(filePath)
    sys.stdout.flush()
