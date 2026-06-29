import sys
try:
    from rembg import remove
    from PIL import Image
    import os

    input_path = r'C:\Users\adityachaturvedi\.gemini\antigravity\brain\4c9d5dfe-c015-4631-b1ef-7063b43a19f5\media__1781691642218.png'
    output_path = r'c:\Users\adityachaturvedi\Desktop\alphamind-ai\frontend\public\logo-cropped.png'

    print(f"Loading image from {input_path}")
    input_img = Image.open(input_path)
    
    print("Removing background using rembg...")
    output_img = remove(input_img)
    
    # We should also crop the bounding box of the non-transparent pixels!
    # Because the original image is 1920x1080 and the logo is small in the middle.
    bbox = output_img.getbbox()
    if bbox:
        print(f"Cropping to bbox {bbox}")
        output_img = output_img.crop(bbox)

    print(f"Saving to {output_path}")
    output_img.save(output_path)
    print('Background removed and image cropped successfully!')
except Exception as e:
    print(f'Error: {e}')
