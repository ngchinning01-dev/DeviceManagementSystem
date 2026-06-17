# Entry point for running the Flask development server.
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=False, port=5000)
