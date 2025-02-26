import sys
import tensorflow as tf
from tensorflow.keras.models import load_model as keras_load_model
import numpy as np
from PIL import Image
import sys
import traceback

# Force UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def load_model():
    model_path = './models/nsfw_mobilenet2.224x224.h5'
    model = keras_load_model(model_path, compile=False)
    return model

def classify_image(model, image_path):
    image = Image.open(image_path).convert('RGB')
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    image_array = image_array.astype(np.float32)
    image_array = np.expand_dims(image_array, axis=0)
    predictions = model.predict(image_array)
    return predictions

def main(image_path):
    try:
        model = load_model()
        predictions = classify_image(model, image_path)
        print("NSFW Predictions:", predictions)

        # Assuming the predictions return in the order of the classes: ['drawings', 'hentai', 'neutral', 'porn', 'sexy']
        nsfw_classes_indices = {'porn': 3, 'hentai': 1, 'sexy': 4}  # Update with correct indices if necessary

        is_nsfw = (
            (predictions[0][nsfw_classes_indices['porn']] > 0.5) or
            (predictions[0][nsfw_classes_indices['sexy']] > 0.4) or
            (predictions[0][nsfw_classes_indices['hentai']] > 0.4)
        )

        print("NSFW Check Result:", is_nsfw)
        return is_nsfw

    except Exception as e:
        with open('error.log', 'w') as f:
            traceback.print_exc(file=f)
        print("NSFW Check Result: False")
        return False

if __name__ == "__main__":
    image_path = sys.argv[1]
    is_nsfw = main(image_path)
    print("NSFW Check Result:", is_nsfw)
