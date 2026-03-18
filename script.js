const API_URL =
  "products.json";

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const availabilitySelect = document.getElementById("availabilitySelect");
const sortSelect = document.getElementById("sortSelect");
const productsGrid = document.getElementById("productsGrid");
const emptyState = document.getElementById("emptyState");

const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");
const subtotalEl = document.getElementById("subtotal");
const cartTotalEl = document.getElementById("cartTotal");
function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getCartQuantity(productId) {
  const item = cart.find((entry) => entry.id === productId);
  return item ? item.quantity : 0;
}

function addToCart(product) {
  if (product.status !== "Available") return;

  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderProducts();
  renderCart();
}

function updateCartQuantity(productId, quantity) {
  const nextQty = Math.max(0, Number(quantity) || 0);
  const item = cart.find((entry) => entry.id === productId);

  if (!item) return;

  if (nextQty === 0) {
    cart = cart.filter((entry) => entry.id !== productId);
  } else {
    item.quantity = nextQty;
  }

  saveCart();
  renderProducts();
  renderCart();
}

function getFilteredProducts() {
  let filtered = [...products];

  const search = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const availability = availabilitySelect.value;
  const sort = sortSelect.value;

  if (search) {
    filtered = filtered.filter((product) =>
      product.name.toLowerCase().includes(search)
    );
  }

  if (category !== "All") {
    filtered = filtered.filter((product) => product.group === category);
  }

  if (availability === "Available") {
    filtered = filtered.filter((product) => product.status === "Available");
  } else if (availability === "Unavailable") {
    filtered = filtered.filter((product) => product.status !== "Available");
  }

  if (sort === "price-low-high") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high-low") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "name-a-z") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "name-z-a") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  }

  return filtered;
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  productsGrid.innerHTML = "";

  if (!filteredProducts.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filteredProducts.forEach((product) => {
    const discount = Math.round(
      ((product.msrp - product.price) / product.msrp) * 100
    );
    const quantityInCart = getCartQuantity(product.id);
    const isAvailable = product.status === "Available";

    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `

      <div class="product-top">
        <div class="product-name">
          ${product.name}
        </div>
      </div>
      <div class="product-meta">
        <div>
          <div class="price">
            ${formatMoney(product.price)}
          </div>
          <div class="old-price-row">
            <span class="old-price">
              ${formatMoney(product.msrp)}
            </span>
            <span class="discount-text">
              ${discount}% off
            </span>
          </div>
        </div>
        <div class="stock-badge ${isAvailable ? "available" : "unavailable"}">
          ${isAvailable ? "In Stock" : "Sold Out"}
        </div>
      </div>
      <div class="product-footer">
        <div class="in-cart-row">
          <span>In bag</span>
          <strong>${quantityInCart}</strong>
        </div>
        <button class="add-button" ${isAvailable ? "" : "disabled"}>
          ${isAvailable ? "Add to Bag" : "Unavailable"}
        </button>
      </div>
      `;

    card.querySelector(".add-button").addEventListener("click", () => {
      addToCart(product);
    });

    productsGrid.appendChild(card);
  });
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCountEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  subtotalEl.textContent = formatMoney(subtotal);
  cartTotalEl.textContent = formatMoney(subtotal);

  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="empty-cart">Your bag is empty.</div>`;
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item-top">
        <div>
          <strong>${item.name}</strong><br />
          <small>${item.group}</small>
        </div>
        <strong>${formatMoney(item.price)}</strong>
      </div>

      <div class="cart-item-bottom">
        <span>Qty</span>
        <div class="qty-controls">
          <button class="qty-btn minus">-</button>
          <input class="qty-input" type="number" min="0" value="${item.quantity}" />
          <button class="qty-btn plus">+</button>
        </div>
      </div>

      <div class="line-total">
        Line total <strong>${formatMoney(item.price * item.quantity)}</strong>
      </div>
    `;

    row.querySelector(".minus").addEventListener("click", () => {
      updateCartQuantity(item.id, item.quantity - 1);
    });

    row.querySelector(".plus").addEventListener("click", () => {
      updateCartQuantity(item.id, item.quantity + 1);
    });

    row.querySelector(".qty-input").addEventListener("change", (e) => {
      updateCartQuantity(item.id, e.target.value);
    });

    cartItemsEl.appendChild(row);
  });
}

async function loadProducts() {
  productsGrid.innerHTML = `<div class="empty-cart">Loading products...</div>`;

  try {
    const response = await fetch(API_URL);
    products = await response.json();

    const available = products.filter((p) => p.status === "Available").length;
    const soldOut = products.length - available;

    renderProducts();
    renderCart();
  } catch (error) {
    productsGrid.innerHTML = `<div class="empty-cart">Could not load products.</div>`;
    console.error(error);
  }
}

[searchInput, categorySelect, availabilitySelect, sortSelect].forEach((el) => {
  el.addEventListener("input", renderProducts);
  el.addEventListener("change", renderProducts);
});

loadProducts();