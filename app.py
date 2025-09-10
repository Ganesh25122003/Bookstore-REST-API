from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///books.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Model ---
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "author": self.author, "price": self.price}

# Create DB / tables
with app.app_context():
    db.create_all()

# --- Serve frontend ---
@app.route("/")
def index():
    return render_template("index.html")

# --- API Routes ---
@app.route("/books", methods=["GET"])
def list_books():
    books = Book.query.all()
    return jsonify([b.to_dict() for b in books]), 200

@app.route("/books/<int:book_id>", methods=["GET"])
def get_book(book_id):
    b = Book.query.get(book_id)
    if not b:
        return jsonify({"message": "Book not found"}), 404
    return jsonify(b.to_dict()), 200

@app.route("/books", methods=["POST"])
def create_book():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400
    data = request.get_json()
    title = data.get("title")
    author = data.get("author")
    price = data.get("price")
    if not title or not author or price is None:
        return jsonify({"message": "Missing title, author or price"}), 400
    try:
        price = float(price)
    except ValueError:
        return jsonify({"message": "Price must be a number"}), 400

    new_book = Book(title=title, author=author, price=price)
    db.session.add(new_book)
    db.session.commit()
    return jsonify({"message": "Book added", "book": new_book.to_dict()}), 201

@app.route("/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    b = Book.query.get(book_id)
    if not b:
        return jsonify({"message": "Book not found"}), 404
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400
    data = request.get_json()
    b.title = data.get("title", b.title)
    b.author = data.get("author", b.author)
    if "price" in data:
        try:
            b.price = float(data["price"])
        except ValueError:
            return jsonify({"message": "Price must be a number"}), 400
    db.session.commit()
    return jsonify({"message": "Book updated", "book": b.to_dict()}), 200

@app.route("/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    b = Book.query.get(book_id)
    if not b:
        return jsonify({"message": "Book not found"}), 404
    db.session.delete(b)
    db.session.commit()
    return jsonify({"message": "Book deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True)