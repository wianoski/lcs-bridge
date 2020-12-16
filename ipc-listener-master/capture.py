import cv2
from PIL import Image
import os
import sys
import numpy as np
import requests

uploadPath = str(sys.argv[1])
timestamp = str(sys.argv[2])
cameraPath = str(sys.argv[3])


def cropImage(img, xy, scale_factor):
    center = (img.size[0] * xy[0], img.size[1] * xy[1])
    new_size = (img.size[0] / scale_factor, img.size[1] / scale_factor)
    left = max(0, (int)(center[0] - new_size[0] / 2))
    right = min(img.size[0], (int)(center[0] + new_size[0] / 2))
    upper = max(0, (int)(center[1] - new_size[1] / 2))
    lower = min(img.size[1], (int)(center[1] + new_size[1] / 2))
    cropped_img = img.crop((left, upper, right, lower))
    return cropped_img


if __name__ == '__main__':
    cap = cv2.VideoCapture(cameraPath)
    ret, frame = cap.read()
    cap.release()
    cv2.destroyAllWindows()
    cropped = cropImage(Image.fromarray(
        np.uint8(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))), (0.70, 0.27), 1.2)
    cropped.save(timestamp + '.jpeg')

    with open(timestamp + '.jpeg', 'rb') as capturedImage:
        files = {'fileUpload': capturedImage}
        response = requests.post(uploadPath + timestamp, files=files)
        if response.status_code == 200:
            print(response.json())
        else:
            print('error', response)
        capturedImage.close()
        os.remove(timestamp + '.jpeg')
