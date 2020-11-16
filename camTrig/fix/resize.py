from PIL import Image 
import PIL
import os
import glob

def compress_images(directory=False, quality=40):
    if directory:
        os.chdir(directory)

    files = os.listdir()

    images = [file for file in files if file.endswith(('jpg', 'png'))]

    for image in images:
        print(image)
        img = Image.open(image)
        img.save("Compressed_and_resized_"+image, optimize=True, quality=quality)


def main():
    while(True):
        subdirectory_path = 'E:\\Werk\\gitProj\\bigone\\camTrig\\fix'
        compress_images(directory=subdirectory_path)
        # upload()
        break


if __name__ == '__main__':
    main()