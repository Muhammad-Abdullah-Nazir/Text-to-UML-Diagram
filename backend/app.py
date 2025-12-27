from flask import Flask, request, jsonify
from flask_cors import CORS
from diagram_generator import process_text

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Text to UML Diagram API',
        'status': 'running',
        'endpoints': {
            'generate': '/api/generate (POST)',
            'health': '/api/health (GET)'
        }
    })

@app.route('/api/generate', methods=['POST'])
def generate_diagram():
    """Generate diagram from text"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        result = process_text(text)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Server is running perfectly!'
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 TEXT TO UML DIAGRAM - BACKEND SERVER")
    print("="*60)
    print("📍 Server URL: http://localhost:5000")
    print("📍 API Endpoint: http://localhost:5000/api/generate")
    print("📍 Health Check: http://localhost:5000/api/health")
    print("="*60)
    print("✅ Server is ready! Press Ctrl+C to stop\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')