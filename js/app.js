// ==========================================
// 1. GLOBAL STATE & STORAGE MECHANICS
// ==========================================

let cart = JSON.parse(localStorage.getItem("bagzone_cart")) || [];

function saveCart() {
  localStorage.setItem("bagzone_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.querySelector("header button span");
  if (!badge) return;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalItems;
}

// ==========================================
// 2. INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  applyFilters();
  renderCartPage();
  renderOrdersPage();
});

// ==========================================
// 3. CART CORE OPERATIONS
// ==========================================

window.addToCart = function (productId) {
  const productSource = PRODUCTS.find((p) => p.id === productId);
  if (!productSource) return;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productSource.id,
      name: productSource.name,
      price: productSource.price,
      color: productSource.color,
      image: productSource.image,
      quantity: 1,
    });
  }
  saveCart();
};

// ==========================================
// 4. CART PAGE RENDERER
// ==========================================

function renderCartPage() {
  const cartContainer = document.getElementById("cart-items-container");
  const summaryBox = document.getElementById("cart-summary-box");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm lg:col-span-3">
        <span class="text-5xl block mb-4">🛒</span>
        <h3 class="text-lg font-black text-slate-900 tracking-tight">Your shopping cart is empty</h3>
        <p class="text-slate-400 text-xs mt-1 mb-6">Looks like you haven't added any premium bag gear yet.</p>
        <a href="index.html" class="inline-block bg-[#2bc4c3] hover:bg-[#229e9d] text-white font-bold text-xs tracking-wide px-6 py-3 rounded-xl shadow-sm transition">
          Discover Products &rarr;
        </a>
      </div>
    `;
    if (summaryBox) summaryBox.classList.add("hidden");
    return;
  }

  if (summaryBox) summaryBox.classList.remove("hidden");

  let subtotal = 0;
  cart.forEach((item) => {
    const totalLinePrice = item.price * item.quantity;
    subtotal += totalLinePrice;

    cartContainer.innerHTML += `
      <div class="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4 w-full sm:w-auto">
          <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
            <div class="hidden absolute inset-0 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-400">Bag</div>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm tracking-tight">${item.name}</h4>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">${item.color}</span>
          </div>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
          <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
            <button onclick="changeQuantity('${item.id}', -1)" class="px-3 py-1.5 hover:bg-slate-200 text-slate-500 font-bold transition text-xs">-</button>
            <span class="px-2 font-black text-slate-900 text-xs min-w-[20px] text-center">${item.quantity}</span>
            <button onclick="changeQuantity('${item.id}', 1)" class="px-3 py-1.5 hover:bg-slate-200 text-slate-500 font-bold transition text-xs">+</button>
          </div>
          <div class="text-right min-w-[70px]">
            <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span class="font-black text-slate-900 text-sm">Rs.${totalLinePrice.toFixed(0)}</span>
          </div>
          <button onclick="removeItemFromCart('${item.id}')" class="text-slate-300 hover:text-rose-500 transition font-medium text-sm p-1">✕</button>
        </div>
      </div>
    `;
  });

  const pageSubtotal = document.getElementById("page-subtotal");
  const pageTotal = document.getElementById("page-total");
  if (pageSubtotal) pageSubtotal.textContent = `Rs.${subtotal.toFixed(0)}`;
  if (pageTotal) pageTotal.textContent = `Rs.${subtotal.toFixed(0)}`;
}

window.changeQuantity = function (productId, direction) {
  const targetItem = cart.find((item) => item.id === productId);
  if (!targetItem) return;
  targetItem.quantity += direction;
  if (targetItem.quantity <= 0) {
    removeItemFromCart(productId);
    return;
  }
  saveCart();
  renderCartPage();
};

window.removeItemFromCart = function (productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCartPage();
};

// ==========================================
// 5. CHECKOUT MODAL — STEP 1 (Order Details)
// ==========================================

window.toggleCheckoutModal = function (showFlag) {
  const modal = document.getElementById("checkout-modal");
  const modalBody = document.getElementById("modal-body");
  if (!modal || !modalBody) return;

  if (showFlag) {
    populateCheckoutSummary();
    modal.classList.remove("invisible", "opacity-0");
    modalBody.classList.remove("scale-95");
    modalBody.classList.add("scale-100");
  } else {
    modal.classList.add("invisible", "opacity-0");
    modalBody.classList.remove("scale-100");
    modalBody.classList.add("scale-95");
  }
};

function populateCheckoutSummary() {
  const summaryWrapper = document.getElementById("modal-checkout-items");
  const mSubtotal = document.getElementById("modal-subtotal");
  const mTotal = document.getElementById("modal-total");
  if (!summaryWrapper) return;

  summaryWrapper.innerHTML = "";
  let totalCash = 0;

  cart.forEach((item) => {
    const cost = item.price * item.quantity;
    totalCash += cost;
    summaryWrapper.innerHTML += `
      <div class="flex justify-between items-center text-xs text-slate-600">
        <span>${item.name} <strong class="text-slate-900">x${item.quantity}</strong></span>
        <span class="font-bold text-slate-900">Rs.${cost.toFixed(0)}</span>
      </div>
    `;
  });

  if (mSubtotal) mSubtotal.textContent = `Rs.${totalCash.toFixed(0)}`;
  if (mTotal) mTotal.textContent = `Rs.${totalCash.toFixed(0)}`;
}

// ==========================================
// 6. CHECKOUT — STEP 2 (Payment Method Modal)
// ==========================================

// Temporarily store order details between step 1 and step 2
let pendingOrderData = null;

window.handleOrderSubmission = function (event) {
  event.preventDefault();
  const formElement = event.target;

  const nameField = formElement.querySelector('input[name="Client Name"]');
  const addressField = formElement.querySelector(
    'input[name="Street Address"]',
  );
  const cityField = formElement.querySelector('input[name="City"]');
  const emailField = formElement.querySelector('input[name="_replyto"]');
  const phoneField = formElement.querySelector('input[name="Phone"]');
  const zipField = formElement.querySelector('input[name="Zip Code"]');

  // Save order details temporarily — payment step will finalize it
  pendingOrderData = {
    customerName: nameField ? nameField.value : "Customer",
    email: emailField ? emailField.value : "",
    phone: phoneField ? phoneField.value : "",
    deliveryAddress: `${addressField ? addressField.value : ""}, ${cityField ? cityField.value : ""}, ${zipField ? zipField.value : ""}`,
    items: [...cart],
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };

  // Close checkout modal, open payment modal
  toggleCheckoutModal(false);
  setTimeout(() => openPaymentModal(), 300);
};

// ==========================================
// 7. PAYMENT METHOD MODAL
// ==========================================

window.openPaymentModal = function () {
  const modal = document.getElementById("payment-modal");
  const modalBody = document.getElementById("payment-modal-body");
  if (!modal || !modalBody) return;

  // Reset to method selection view
  showPaymentMethodSelection();

  modal.classList.remove("invisible", "opacity-0");
  modalBody.classList.remove("scale-95");
  modalBody.classList.add("scale-100");
};

window.closePaymentModal = function () {
  const modal = document.getElementById("payment-modal");
  const modalBody = document.getElementById("payment-modal-body");
  if (!modal || !modalBody) return;
  modal.classList.add("invisible", "opacity-0");
  modalBody.classList.remove("scale-100");
  modalBody.classList.add("scale-95");
};

function showPaymentMethodSelection() {
  const content = document.getElementById("payment-modal-content");
  if (!content) return;

  const total = pendingOrderData ? pendingOrderData.total : 0;

  content.innerHTML = `
    <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
      <div>
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Select Payment Method</h2>
        <p class="text-slate-400 text-xs mt-0.5">Choose how you'd like to pay for your order.</p>
      </div>
      <button onclick="closePaymentModal()" class="text-slate-300 hover:text-slate-500 text-xl font-bold p-1 transition">&times;</button>
    </div>

    <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-6 flex justify-between items-center">
      <span class="text-xs font-bold text-slate-500">Amount Payable</span>
      <span class="text-lg font-black text-[#2bc4c3]">Rs.${total.toFixed(0)}</span>
    </div>

    <div class="space-y-3">

      <button onclick="showPaymentDetails('easypaisa')" class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-[#4CAF50] hover:bg-green-50/50 transition group">
        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📱</div>
        <div class="text-left">
          <span class="block font-black text-slate-900 text-sm">EasyPaisa</span>
          <span class="text-xs text-slate-400">Mobile wallet transfer</span>
        </div>
        <svg class="ml-auto w-4 h-4 text-slate-300 group-hover:text-[#4CAF50] transition" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
      </button>

      <button onclick="showPaymentDetails('bank')" class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/50 transition group">
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏦</div>
        <div class="text-left">
          <span class="block font-black text-slate-900 text-sm">Bank Transfer</span>
          <span class="text-xs text-slate-400">Direct bank account deposit</span>
        </div>
        <svg class="ml-auto w-4 h-4 text-slate-300 group-hover:text-blue-400 transition" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
      </button>

      <button onclick="confirmOrder('cod')" class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-400 hover:bg-amber-50/50 transition group">
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💵</div>
        <div class="text-left">
          <span class="block font-black text-slate-900 text-sm">Cash on Delivery</span>
          <span class="text-xs text-slate-400">Pay when your order arrives</span>
        </div>
        <svg class="ml-auto w-4 h-4 text-slate-300 group-hover:text-amber-400 transition" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
      </button>

    </div>
  `;
}

window.showPaymentDetails = function (method) {
  const content = document.getElementById("payment-modal-content");
  if (!content) return;

  const total = pendingOrderData ? pendingOrderData.total : 0;

  let detailsHTML = "";

  if (method === "easypaisa") {
    detailsHTML = `
      <div class="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📱</div>
          <div>
            <h3 class="font-black text-slate-900 text-sm">EasyPaisa Transfer</h3>
            <p class="text-xs text-slate-400">Send the exact amount to the number below</p>
          </div>
        </div>
        <div class="bg-white rounded-xl p-3 border border-green-100 space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">Account Name</span>
            <span class="font-black text-slate-900">Muhammad Kashif Nazir</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">EasyPaisa Number</span>
            <span class="font-black text-slate-900">03XX-XXXXXXX</span>
          </div>
          <div class="flex justify-between text-xs border-t border-slate-100 pt-2 mt-2">
            <span class="text-slate-400 font-bold">Amount to Send</span>
            <span class="font-black text-green-600 text-sm">Rs.${total.toFixed(0)}</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 leading-relaxed">After sending payment, click <strong>"I Have Paid"</strong> below. Your order will be marked as <strong>Payment Pending</strong> and confirmed once we verify the transaction.</p>
      </div>
    `;
  } else if (method === "bank") {
    detailsHTML = `
      <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🏦</div>
          <div>
            <h3 class="font-black text-slate-900 text-sm">Bank Transfer</h3>
            <p class="text-xs text-slate-400">Deposit the exact amount to the account below</p>
          </div>
        </div>
        <div class="bg-white rounded-xl p-3 border border-blue-100 space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">Account Name</span>
            <span class="font-black text-slate-900">Muhammad Kashif Nazir</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">Bank Name</span>
            <span class="font-black text-slate-900">Placeholder Bank</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">Account Number</span>
            <span class="font-black text-slate-900">XXXX-XXXXXXXXX-XXX</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-bold">IBAN</span>
            <span class="font-black text-slate-900">PKXX XXXX XXXX XXXX XXXX XX</span>
          </div>
          <div class="flex justify-between text-xs border-t border-slate-100 pt-2 mt-2">
            <span class="text-slate-400 font-bold">Amount to Transfer</span>
            <span class="font-black text-blue-600 text-sm">Rs.${total.toFixed(0)}</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 leading-relaxed">After transferring, click <strong>"I Have Paid"</strong> below. Your order will be marked as <strong>Payment Pending</strong> and confirmed once we verify the transaction.</p>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
      <button onclick="showPaymentMethodSelection()" class="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
      </button>
      <div class="flex-1">
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Payment Details</h2>
        <p class="text-slate-400 text-xs mt-0.5">Follow the instructions below.</p>
      </div>
      <button onclick="closePaymentModal()" class="text-slate-300 hover:text-slate-500 text-xl font-bold p-1 transition">&times;</button>
    </div>

    ${detailsHTML}

    <div class="flex gap-3">
      <button onclick="showPaymentMethodSelection()" class="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition">Back</button>
      <button onclick="confirmOrder('${method}')" class="w-2/3 bg-[#2bc4c3] hover:bg-[#229e9d] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-sm">I Have Paid ✓</button>
    </div>
  `;
};

// ==========================================
// 8. ORDER CONFIRMATION
// ==========================================

window.confirmOrder = function (paymentMethod) {
  if (!pendingOrderData) return;

  const paymentLabels = {
    easypaisa: "EasyPaisa",
    bank: "Bank Transfer",
    cod: "Cash on Delivery",
  };

  const newOrder = {
    orderId: "HE-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    customerName: pendingOrderData.customerName,
    email: pendingOrderData.email,
    phone: pendingOrderData.phone,
    deliveryAddress: pendingOrderData.deliveryAddress,
    items: pendingOrderData.items,
    total: pendingOrderData.total,
    paymentMethod: paymentLabels[paymentMethod],
    // COD is auto-confirmed, others are pending verification
    status: paymentMethod === "cod" ? "confirmed" : "pending",
  };

  let orderHistory = JSON.parse(localStorage.getItem("bagzone_orders")) || [];
  orderHistory.unshift(newOrder);
  localStorage.setItem("bagzone_orders", JSON.stringify(orderHistory));

  // Clear cart
  cart = [];
  localStorage.setItem("bagzone_cart", JSON.stringify(cart));
  updateCartBadge();
  pendingOrderData = null;

  closePaymentModal();
  window.location.href = "orders.html";
};

// ==========================================
// 9. FILTER ENGINE
// ==========================================

function applyFilters() {
  const searchInput = document.getElementById("catalog-search");
  const minPriceInput = document.getElementById("filter-min-price");
  const maxPriceInput = document.getElementById("filter-max-price");
  if (!searchInput || !minPriceInput || !maxPriceInput) return;

  const query = searchInput.value.toLowerCase().trim();
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.color.toLowerCase().includes(query);
    return matchesPrice && matchesSearch;
  });

  renderFilteredGrid(filteredProducts);
}

function renderFilteredGrid(productsList) {
  const productGrid = document.getElementById("homepage-product-grid");
  if (!productGrid) return;

  productGrid.innerHTML = "";

  if (productsList.length === 0) {
    productGrid.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <span class="text-5xl block mb-4">🔍</span>
        <h4 class="font-black text-slate-900 tracking-tight text-lg">No matching bags found</h4>
        <p class="text-slate-400 text-xs mt-1">Try tweaking your search keywords or broadening your budget boundaries.</p>
      </div>
    `;
    return;
  }

  productsList.forEach((product) => {
    productGrid.innerHTML += `
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col group">
        <div class="h-64 bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-400">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
          <div class="hidden absolute inset-0 flex items-center justify-center p-4 text-center bg-slate-100">
            <span class="text-xs font-semibold text-slate-400">Missing Image<br><span class="text-[10px] font-mono">${product.image}</span></span>
          </div>
        </div>
        <div class="p-6 flex flex-col flex-grow">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="font-black text-slate-900 text-base tracking-tight">${product.name}</h3>
            <span class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg whitespace-nowrap">${product.color}</span>
          </div>
          <p class="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6 flex-grow">${product.description}</p>
          <div class="flex items-center justify-between gap-4 mt-auto border-t border-slate-50 pt-4">
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price</span>
              <span class="text-base font-black text-slate-900">Rs.${product.price.toFixed(0)}</span>
            </div>
            <button onclick="addToCart('${product.id}')" class="bg-[#2bc4c3] hover:bg-[#229e9d] text-white font-bold px-3 py-2 rounded-xl text-xs tracking-wide shadow-sm transition">Add To Cart 🎒</button>
          </div>
        </div>
      </div>
    `;
  });
}

// ==========================================
// 10. ORDERS PAGE RENDERER
// ==========================================

function renderOrdersPage() {
  const container = document.getElementById("orders-log-container");
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem("bagzone_orders")) || [];
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <span class="text-5xl block mb-4">📦</span>
        <h3 class="text-lg font-black text-slate-900 tracking-tight">No orders placed yet</h3>
        <p class="text-slate-400 text-xs mt-1 mb-6">Your historical purchase logs will show up here.</p>
        <a href="index.html" class="inline-block bg-[#2bc4c3] hover:bg-[#229e9d] text-white font-bold text-xs tracking-wide px-6 py-3 rounded-xl shadow-sm transition">
          Shop Premium Bags &rarr;
        </a>
      </div>
    `;
    return;
  }

  orders.forEach((order) => {
    const itemsMarkup = order.items
      .map(
        (item) => `
        <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
          <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-shrink-0">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
          </div>
          <div class="flex-grow">
            <h5 class="text-xs font-bold text-slate-900">${item.name}</h5>
            <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">${item.color} <strong class="text-slate-700 font-black">x${item.quantity}</strong></span>
          </div>
          <span class="text-xs font-black text-slate-900">Rs.${(item.price * item.quantity).toFixed(0)}</span>
        </div>
      `,
      )
      .join("");

    // Status badge logic
    const isPending = order.status === "pending";
    const statusBadge = isPending
      ? `<span class="bg-amber-100 text-amber-700 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase inline-block animate-pulse">⏳ Payment Pending</span>`
      : `<span class="bg-emerald-100 text-emerald-700 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase inline-block">✅ Confirmed</span>`;

    // Payment method badge
    const paymentBadge = `<span class="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase inline-block">${order.paymentMethod || "N/A"}</span>`;

    container.innerHTML += `
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="bg-slate-50 border-b border-slate-100 p-4 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Order ID</span>
            <span class="font-black text-slate-900 font-mono">${order.orderId}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Date</span>
            <span class="font-bold text-slate-700">${order.date}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Payment</span>
            ${paymentBadge}
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Status</span>
            ${statusBadge}
          </div>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div class="md:col-span-2 space-y-1">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Items Purchased</span>
            ${itemsMarkup}
          </div>
          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
            <div>
              <span class="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Shipping To</span>
              <strong class="text-slate-900 block mt-0.5">${order.customerName}</strong>
              <p class="text-slate-500 text-[11px] leading-tight mt-0.5">${order.deliveryAddress}</p>
            </div>
            ${order.phone ? `<div><span class="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Phone</span><p class="text-slate-700 font-bold text-[11px]">${order.phone}</p></div>` : ""}
            <div class="border-t border-slate-200/60 pt-2 mt-2 flex justify-between items-baseline">
              <span class="text-slate-900 font-black">Total</span>
              <span class="text-base font-black text-[#2bc4c3]">Rs.${order.total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        ${
          isPending
            ? `
        <div class="bg-amber-50 border-t border-amber-100 px-5 py-3 text-xs text-amber-700 font-medium">
          ⚠️ We are verifying your <strong>${order.paymentMethod}</strong> payment. Your order will be confirmed and dispatched once the transaction is verified.
        </div>`
            : ""
        }
      </div>
    `;
  });
}
