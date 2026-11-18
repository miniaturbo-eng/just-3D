import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Mistral } from "@mistralai/mistralai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contact@just3d.fr";
const PRODUCTS_FILE = path.join(__dirname, "data", "products.json");

const mistral = process.env.MISTRAL_API_KEY
  ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY })
  : null;
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function readProducts() {
  try {
    return JSON.parse(await fs.readFile(PRODUCTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeProducts(products) {
  await fs.mkdir(path.dirname(PRODUCTS_FILE), { recursive: true });
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

app.get("/api/config", (req, res) => {
  res.json({ contactEmail: CONTACT_EMAIL, chatEnabled: Boolean(mistral) });
});

app.get("/api/products", async (req, res) => {
  res.json(await readProducts());
});

app.post("/api/products", async (req, res) => {
  const { name, description, price, image } = req.body || {};
  if (!name || typeof name !== "string" || !price || Number(price) <= 0) {
    return res.status(400).json({ error: "Nom et prix (positif) obligatoires." });
  }
  const products = await readProducts();
  const product = {
    id: Date.now().toString(36),
    name: String(name).slice(0, 120),
    description: String(description || "").slice(0, 500),
    price: Number(price),
    image: String(image || "").slice(0, 500),
  };
  products.push(product);
  await writeProducts(products);
  res.status(201).json(product);
});

app.post("/api/chat", async (req, res) => {
  const message = req.body?.message;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message manquant." });
  }
  if (!mistral) {
    return res.json({
      reply:
        `L'assistant intelligent est désactivé (aucune clé MISTRAL_API_KEY configurée). ` +
        `Le catalogue ci-contre reste disponible, et pour toute impression 3D personnalisée, ` +
        `contactez-nous par email à ${CONTACT_EMAIL}.`,
    });
  }
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-10) : [];
  const products = await readProducts();
  const catalogue = products.length
    ? products.map((p) => `- ${p.name} : ${p.price.toFixed(2)} € — ${p.description}`).join("\n")
    : "(aucun produit en vente actuellement)";

  try {
    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            `Tu es l'assistant de JUST3D, une entreprise de vente d'impression 3D. ` +
            `Réponds en français, de façon concise et amicale.\n` +
            `Catalogue actuel :\n${catalogue}\n` +
            `Si le client veut une impression 3D personnalisée ou spéciale, invite-le à contacter ` +
            `l'équipe par email à ${CONTACT_EMAIL} en décrivant son projet.`,
        },
        ...history.map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
        { role: "user", content: String(message).slice(0, 2000) },
      ],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("Erreur Mistral :", err.message);
    res.status(502).json({ error: "L'assistant est momentanément indisponible." });
  }
});

app.listen(PORT, () => {
  console.log(`JUST3D en ligne sur http://localhost:${PORT}`);
});
