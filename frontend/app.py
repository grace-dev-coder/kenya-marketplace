from flask import Flask, send_from_directory, jsonify
import os

app = Flask(__name__)

@app.route('/')
def index():
    # Show what files exist for debugging
    files = os.listdir('.')
    html_files = [f for f in files if f.endswith('.html')]
    
    if 'index.html' in files:
        return send_from_directory('.', 'index.html')
    
    # Debug page if index.html not found
    return f'''
    <h1>Debug Info</h1>
    <p><strong>Current directory:</strong> {os.getcwd()}</p>
    <p><strong>Files in directory:</strong> {files}</p>
    <p><strong>HTML files:</strong> {html_files}</p>
    <p>index.html not found!</p>
    '''

@app.route('/<<path:path>')
def serve(path):
    file_path = os.path.join('.', path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory('.', path)
    return f'''
    <h1>404 - File Not Found</h1>
    <p>Path requested: {path}</p>
    <p>Current directory: {os.getcwd()}</p>
    <p>Files available: {os.listdir('.')}</p>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))