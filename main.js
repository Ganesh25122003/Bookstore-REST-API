const apiBase = "/books";

document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  document.getElementById("book-form").addEventListener("submit", submitForm);
  document.getElementById("cancel-btn").addEventListener("click", resetForm);
  document.getElementById("search").addEventListener("input", loadBooks);
});

async function loadBooks() {
  try {
    const res = await fetch(apiBase);
    const books = await res.json();
    const q = document.getElementById("search").value.trim().toLowerCase();
    const list = document.getElementById("books-list");
    list.innerHTML = "";
    const filtered = books.filter(b =>
      !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
    if (filtered.length === 0) {
      list.innerHTML = "<p>No books found.</p>";
      return;
    }
    filtered.forEach(b => {
      const div = document.createElement("div");
      div.className = "book-item";
      div.innerHTML = `
        <div class="book-details">
          <strong>${escapeHtml(b.title)}</strong><br>
          <small>${escapeHtml(b.author)} • ₹ ${b.price}</small>
        </div>
        <div class="book-actions">
          <button class="btn-small" onclick="editBook(${b.id})">Edit</button>
          <button class="btn-small btn-delete" onclick="deleteBook(${b.id})">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

function escapeHtml(text) {
  return text
    ? text.replace(/[&<>"']/g, m => (
        {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]
      ))
    : "";
}

async function submitForm(e) {
  e.preventDefault();
  const id = document.getElementById("book-id").value;
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const price = document.getElementById("price").value;

  if (!title || !author || price === "") {
    setMsg("Please fill all fields", true);
    return;
  }

  const payload = { title, author, price: Number(price) };
  try {
    if (id) {
      // update
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Book updated successfully");
        resetForm();
        loadBooks();
      } else {
        setMsg(data.message || "Update failed", true);
      }
    } else {
      // create
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Book added successfully");
        resetForm();
        loadBooks();
      } else {
        setMsg(data.message || "Add failed", true);
      }
    }
  } catch (err) {
    setMsg("Server error", true);
    console.error(err);
  }
}

async function editBook(id) {
  try {
    const res = await fetch(`${apiBase}/${id}`);
    if (!res.ok) {
      setMsg("Book not found", true);
      return;
    }
    const b = await res.json();
    document.getElementById("book-id").value = b.id;
    document.getElementById("title").value = b.title;
    document.getElementById("author").value = b.author;
    document.getElementById("price").value = b.price;
    document.getElementById("form-title").textContent = "Edit Book";
    document.getElementById("submit-btn").textContent = "Update Book";
    document.getElementById("cancel-btn").style.display = "inline-block";
  } catch (err) {
    console.error(err);
  }
}

async function deleteBook(id) {
  if (!confirm("Delete this book?")) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setMsg("Book deleted");
      loadBooks();
    } else {
      setMsg(data.message || "Delete failed", true);
    }
  } catch (err) {
    console.error(err);
  }
}

function resetForm() {
  document.getElementById("book-id").value = "";
  document.getElementById("title").value = "";
  document.getElementById("author").value = "";
  document.getElementById("price").value = "";
  document.getElementById("form-title").textContent = "Add New Book";
  document.getElementById("submit-btn").textContent = "Add Book";
  document.getElementById("cancel-btn").style.display = "none";
  setMsg("", false);
}

function setMsg(text, isError = false) {
  const el = document.getElementById("msg");
  el.style.color = isError ? "red" : "green";
  el.textContent = text;
  if (!text) el.style.display = "none";
  else el.style.display = "block";
}