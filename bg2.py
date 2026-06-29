from PIL import Image

def remove_bg():
    input_path = r'C:\Users\adityachaturvedi\.gemini\antigravity\brain\4c9d5dfe-c015-4631-b1ef-7063b43a19f5\media__1781691642218.png'
    output_path = r'c:\Users\adityachaturvedi\Desktop\alphamind-ai\frontend\public\logo-cropped.png'

    print(f"Loading {input_path}")
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Simple thresholding: if pixel is not bright/white enough, make it transparent
    for item in data:
        r, g, b, a = item
        # The background is a blue gradient, so mostly blue.
        # Text/3D is probably white or bright. Let's make anything that is dark or strongly blue transparent
        # Wait, if we just keep pixels where (r+g+b)/3 > 150 and it's not predominantly blue
        if (r > 150 and g > 150 and b > 150) or (r > 200) or (g > 200):
            new_data.append(item)
        else:
            new_data.append((255, 255, 255, 0))
            
    img.putdata(new_data)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path)
    print("Saved to", output_path)

remove_bg()
