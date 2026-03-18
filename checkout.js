const cart = JSON.parse(localStorage.getItem("cart")) || [];

const checkoutItemsEl = document.getElementById("checkoutItems");
const subtotalEl = document.getElementById("checkoutSubtotal");
const shippingEl = document.getElementById("checkoutShipping");
const taxEl = document.getElementById("checkoutTax");
const totalEl = document.getElementById("checkoutTotal");

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function renderCheckout() {
  checkoutItemsEl.innerHTML = "";

  if (!cart.length) {
    checkoutItemsEl.innerHTML = `
      <div class="empty-cart">
        Your bag is empty. <a href="home.html">Return to the store</a>.
      </div>
    `;
    subtotalEl.textContent = "$0.00";
    shippingEl.textContent = "$0.00";
    taxEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 24.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "checkout-item";

    row.innerHTML = `
      <div class="checkout-item-top">
        <div>
          <strong>${item.name}</strong><br />
          <small>${item.group} • Qty ${item.quantity}</small>
        </div>
        <strong>${formatMoney(item.price * item.quantity)}</strong>
      </div>
    `;

    checkoutItemsEl.appendChild(row);
  });

  subtotalEl.textContent = formatMoney(subtotal);
  shippingEl.textContent = formatMoney(shipping);
  taxEl.textContent = formatMoney(tax);
  totalEl.textContent = formatMoney(total);
}

renderCheckout();