from google.cloud import storage
from firebase import firebase
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="<add your credentials path>"
firebase = firebase.FirebaseApplication('<your firebase database path>')
