# import cv2
# import numpy as np
# import base64
# import os
# import tempfile
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import logging
# from datetime import datetime

# app = Flask(__name__)
# CORS(app)

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# def extract_face_features(image_path):
#     """Extract face features using OpenCV"""
#     try:
#         # Load image
#         img = cv2.imread(image_path)
#         if img is None:
#             return None, 0, None
        
#         # Convert to grayscale
#         gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
#         # Load face detector
#         face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
#         # Detect faces
#         faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
#         if len(faces) == 0:
#             return None, 0, None
        
#         # Get the largest face
#         (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
        
#         # Extract face ROI
#         face_roi = gray[y:y+h, x:x+w]
        
#         # Resize to standard size
#         face_resized = cv2.resize(face_roi, (100, 100))
        
#         # Calculate histogram
#         hist = cv2.calcHist([face_resized], [0], None, [256], [0, 256])
#         hist = cv2.normalize(hist, hist).flatten()
        
#         return hist, len(faces), (x, y, w, h)
        
#     except Exception as e:
#         logger.error(f"Extract features error: {e}")
#         return None, 0, None

# def compare_histograms(hist1, hist2):
#     """Compare two histograms"""
#     if hist1 is None or hist2 is None:
#         return 0
    
#     similarity = cv2.compareHist(
#         hist1.astype(np.float32),
#         hist2.astype(np.float32),
#         cv2.HISTCMP_CORREL
#     )
    
#     # Convert to percentage and clamp
#     similarity_percent = max(0, min(100, similarity * 100))
#     return similarity_percent

# @app.route('/verify', methods=['POST'])
# def verify_faces():
#     try:
#         data = request.get_json()
#         img1_base64 = data.get('image1')
#         img2_base64 = data.get('image2')
        
#         if not img1_base64 or not img2_base64:
#             return jsonify({
#                 'success': False,
#                 'error': 'Both images are required'
#             }), 400
        
#         logger.info(f"Received face verification request")
        
#         temp_files = []
        
#         try:
#             # Create temp directory
#             temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
#             os.makedirs(temp_dir, exist_ok=True)
            
#             # Save images
#             with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False, dir=temp_dir) as f1:
#                 f1.write(base64.b64decode(img1_base64))
#                 img1_path = f1.name
#                 temp_files.append(img1_path)
            
#             with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False, dir=temp_dir) as f2:
#                 f2.write(base64.b64decode(img2_base64))
#                 img2_path = f2.name
#                 temp_files.append(img2_path)
            
#             # Extract features
#             hist1, faces1, _ = extract_face_features(img1_path)
#             hist2, faces2, _ = extract_face_features(img2_path)
            
#             if faces1 == 0 or faces2 == 0:
#                 return jsonify({
#                     'success': True,
#                     'verified': False,
#                     'similarity': 0,
#                     'message': f'Face detected in image1: {faces1}, image2: {faces2}'
#                 })
            
#             # Compare
#             similarity = compare_histograms(hist1, hist2)
#             is_match = similarity > 60  # 60% threshold
            
#             response = {
#                 'success': True,
#                 'verified': is_match,
#                 'similarity': round(similarity, 2),
#                 'message': 'Face verification completed'
#             }
            
#             logger.info(f"Verification result: match={is_match}, similarity={similarity:.2f}%")
#             return jsonify(response)
            
#         finally:
#             for temp_file in temp_files:
#                 try:
#                     if os.path.exists(temp_file):
#                         os.unlink(temp_file)
#                 except:
#                     pass
        
#     except Exception as e:
#         logger.error(f"Verification error: {e}")
#         return jsonify({
#             'success': False,
#             'error': str(e)
#         }), 500

# @app.route('/health', methods=['GET'])
# def health_check():
#     return jsonify({
#         'status': 'healthy',
#         'service': 'face-verification',
#         'timestamp': datetime.now().isoformat()
#     })

# @app.route('/test', methods=['GET'])
# def test():
#     return jsonify({
#         'message': 'Face verification service is running!',
#         'status': 'ok'
#     })

# if __name__ == '__main__':
#     port = 5001
#     print(f"\n{'='*50}")
#     print(f"Face Verification Service Started!")
#     print(f"URL: http://localhost:{port}")
#     print(f"Health Check: http://localhost:{port}/health")
#     print(f"OpenCV Version: {cv2.__version__}")
#     print(f"{'='*50}\n")
#     app.run(host='0.0.0.0', port=port, debug=False, threaded=True)


import cv2
import numpy as np
import base64
import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_face_features_advanced(image_path):
    """Extract face features using multiple methods for better accuracy"""
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return None, 0, None
        
        # Convert to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Load multiple face detectors for better detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        alt_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
        
        # Try both detectors
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)
        
        if len(faces) == 0:
            faces = alt_cascade.detectMultiScale(gray, 1.1, 5)
        
        if len(faces) == 0:
            return None, 0, None
        
        # Get the largest face
        (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
        
        # Extract face with margin
        margin = int(min(w, h) * 0.1)
        x = max(0, x - margin)
        y = max(0, y - margin)
        w = min(img.shape[1] - x, w + 2*margin)
        h = min(img.shape[0] - y, h + 2*margin)
        
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to standard size
        face_resized = cv2.resize(face_roi, (150, 150))
        
        # Apply histogram equalization for better contrast
        face_equalized = cv2.equalizeHist(face_resized)
        
        # Calculate multiple features
        # 1. Histogram
        hist = cv2.calcHist([face_equalized], [0], None, [256], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        
        # 2. LBP (Local Binary Pattern) - for better face recognition
        lbp = compute_lbp(face_equalized)
        
        # 3. HOG (Histogram of Oriented Gradients) features
        hog_features = compute_hog(face_equalized)
        
        return {
            'histogram': hist,
            'lbp': lbp,
            'hog': hog_features,
            'face_size': (w, h)
        }, len(faces), (x, y, w, h)
        
    except Exception as e:
        logger.error(f"Extract features error: {e}")
        return None, 0, None

def compute_lbp(image):
    """Compute Local Binary Pattern features"""
    lbp = np.zeros_like(image)
    for i in range(1, image.shape[0]-1):
        for j in range(1, image.shape[1]-1):
            center = image[i, j]
            code = 0
            code |= (image[i-1, j-1] >= center) << 7
            code |= (image[i-1, j] >= center) << 6
            code |= (image[i-1, j+1] >= center) << 5
            code |= (image[i, j+1] >= center) << 4
            code |= (image[i+1, j+1] >= center) << 3
            code |= (image[i+1, j] >= center) << 2
            code |= (image[i+1, j-1] >= center) << 1
            code |= (image[i, j-1] >= center) << 0
            lbp[i, j] = code
    hist = cv2.calcHist([lbp], [0], None, [256], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()
    return hist

def compute_hog(image):
    """Compute Histogram of Oriented Gradients features"""
    gx = cv2.Sobel(image, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(image, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
    
    # Create 9-bin histogram
    bin_n = 9
    hist = np.zeros(bin_n)
    bin_edges = np.linspace(0, 180, bin_n + 1)
    
    for i in range(image.shape[0]):
        for j in range(image.shape[1]):
            bin_idx = np.digitize(ang[i, j], bin_edges) - 1
            if 0 <= bin_idx < bin_n:
                hist[bin_idx] += mag[i, j]
    
    hist = cv2.normalize(hist, hist).flatten()
    return hist

def compare_faces_advanced(features1, features2):
    """Compare faces using multiple features"""
    if features1 is None or features2 is None:
        return 0
    
    # Compare histograms
    hist_similarity = cv2.compareHist(
        features1['histogram'].astype(np.float32),
        features2['histogram'].astype(np.float32),
        cv2.HISTCMP_CORREL
    )
    
    # Compare LBP
    lbp_similarity = cv2.compareHist(
        features1['lbp'].astype(np.float32),
        features2['lbp'].astype(np.float32),
        cv2.HISTCMP_CORREL
    )
    
    # Compare HOG
    hog_similarity = cv2.compareHist(
        features1['hog'].astype(np.float32),
        features2['hog'].astype(np.float32),
        cv2.HISTCMP_CORREL
    )
    
    # Weighted average (tuned for better accuracy)
    similarity = (hist_similarity * 0.5 + lbp_similarity * 0.3 + hog_similarity * 0.2) * 100
    similarity = max(0, min(100, similarity))
    
    return similarity

@app.route('/verify', methods=['POST'])
def verify_faces():
    try:
        data = request.get_json()
        img1_base64 = data.get('image1')
        img2_base64 = data.get('image2')
        
        if not img1_base64 or not img2_base64:
            return jsonify({
                'success': False,
                'error': 'Both images are required'
            }), 400
        
        logger.info(f"Received face verification request")
        
        temp_files = []
        
        try:
            # Create temp directory
            temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            
            # Save images
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False, dir=temp_dir) as f1:
                f1.write(base64.b64decode(img1_base64))
                img1_path = f1.name
                temp_files.append(img1_path)
            
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False, dir=temp_dir) as f2:
                f2.write(base64.b64decode(img2_base64))
                img2_path = f2.name
                temp_files.append(img2_path)
            
            # Extract advanced features
            features1, faces1, _ = extract_face_features_advanced(img1_path)
            features2, faces2, _ = extract_face_features_advanced(img2_path)
            
            if faces1 == 0 or faces2 == 0:
                return jsonify({
                    'success': True,
                    'verified': False,
                    'similarity': 0,
                    'message': f'Face detected in image1: {faces1}, image2: {faces2}'
                })
            
            # Compare using advanced method
            similarity = compare_faces_advanced(features1, features2)
            is_match = similarity > 45  # Lower threshold for better matching
            
            response = {
                'success': True,
                'verified': is_match,
                'similarity': round(similarity, 2),
                'message': 'Face verification completed'
            }
            
            logger.info(f"Verification result: match={is_match}, similarity={similarity:.2f}%")
            return jsonify(response)
            
        finally:
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
                except:
                    pass
        
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'face-verification',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        'message': 'Face verification service is running!',
        'status': 'ok'
    })

if __name__ == '__main__':
    port = 5001
    print(f"\n{'='*50}")
    print(f"Face Verification Service Started!")
    print(f"URL: http://localhost:{port}")
    print(f"Health Check: http://localhost:{port}/health")
    print(f"OpenCV Version: {cv2.__version__}")
    print(f"{'='*50}\n")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)