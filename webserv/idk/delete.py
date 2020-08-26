import os, glob
for filename in glob.glob("15*"):
    os.remove(filename) 