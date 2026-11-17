const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const productsDiv = document.getElementById("products");
const productForm = document.getElementById("product-form");
const toggleAdmin = document.getElementById("toggle-admin");
const contactEmail = document.getElementById("contact-email");

const history = [];

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "user" : "bot"}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addMsg("user", message);
  history.push({ role: "user", content: message });
  chatInput.value = "";

  addMsg("bot", "…");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(0, -1) }),
    });
    const data = await res.json();
    chatBox.lastChild.remove();
    const reply = data.reply || data.error || "Erreur inconnue.";
    addMsg("bot", reply);
    history.push({ role: "assistant", content: reply });
  } catch {
    chatBox.lastChild.remove();
    addMsg("bot", "Impossible de contacter le serveur.");
  }
});

async function loadProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();
  productsDiv.innerHTML = "";
  if (!products.length) {
    productsDiv.innerHTML = '<p class="empty">Aucun produit en vente pour le moment.</p>';
    return;
  }
  for (const p of products) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.remove()">` : ""}
      <div class="card-body">
        <h3></h3>
        <p></p>
        <span class="price"></span>
      </div>`;
    card.querySelector("h3").textContent = p.name;
    card.querySelector("p").textContent = p.description;
    card.querySelector(".price").textContent = `${p.price.toFixed(2)} €`;
    productsDiv.appendChild(card);
  }
}

toggleAdmin.addEventListener("click", () => productForm.classList.toggle("hidden"));

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById("p-name").value,
    price: parseFloat(document.getElementById("p-price").value),
    image: document.getElementById("p-image").value,
    description: document.getElementById("p-desc").value,
  };
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    productForm.reset();
    productForm.classList.add("hidden");
    loadProducts();
  }
});

(async () => {
  const cfg = await (await fetch("/api/config")).json();
  contactEmail.textContent = cfg.contactEmail;
  contactEmail.href = `mailto:${cfg.contactEmail}?subject=${encodeURIComponent("Demande d'impression 3D personnalisée")}`;
  loadProducts();
})();
