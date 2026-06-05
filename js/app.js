// ==========================================
// 1. GLOBAL STATE & STORAGE MECHANICS
// ==========================================

// Retrieve cart data from localStorage on load, or default to an empty array
let cart = JSON.parse(localStorage.getItem("bagzone_cart")) || [];

// Save current cart snapshot to localStorage
function saveCart() {
  localStorage.setItem("bagzone_cart", JSON.stringify(cart));
  updateCartBadge();
}

// Global UI counter update engine for the header button badge
function updateCartBadge() {
  const badge = document.querySelector("header button span");
  if (!badge) return;

  // Sum up total units across all distinct items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalItems;
}

// ==========================================
// 2. INITIALIZATION LOOPS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  applyFilters(); // Kicks off homepage grid rendering automatically based on input states
  renderCartPage();
  renderOrdersPage(); // Renders the cart catalog if the user is on cart.html
});

// ==========================================
// 3. CART CORE INTERACTION OPERATIONS
// ==========================================

window.addToCart = function (productId) {
  // Find item details from our database source (PRODUCTS array from products.js)
  const productSource = PRODUCTS.find((p) => p.id === productId);
  if (!productSource) return;

  // Check if item is already sitting in the cart array selection
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    // Add fresh object copy into storage boundaries
    cart.push({
      id: productSource.id,
      name: productSource.name,
      price: productSource.price,
      color: productSource.color,
      image: productSource.image,
      quantity: 1,
    });
  }

  // Save changes and silently sync UI badges without alerting the browser
  saveCart();
};

// ==========================================
// 4. CART PAGE DYNAMIC GENERATOR (cart.html)
// ==========================================

function renderCartPage() {
  const cartContainer = document.getElementById("cart-items-container");
  const summaryBox = document.getElementById("cart-summary-box");

  // Safety bypass exit if code executes outside cart.html bounds
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  // Case A: Cart is empty
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

  // Case B: Items exist inside array, unhide calculation card container
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
            <span class="font-black text-slate-900 text-sm">$${totalLinePrice.toFixed(2)}</span>
          </div>

          <button onclick="removeItemFromCart('${item.id}')" class="text-slate-300 hover:text-rose-500 transition font-medium text-sm p-1">✕</button>
        </div>
      </div>
    `;
  });

  // Inject computed parameters straight into DOM anchor nodes
  const pageSubtotal = document.getElementById("page-subtotal");
  const pageTotal = document.getElementById("page-total");

  if (pageSubtotal) pageSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (pageTotal) pageTotal.textContent = `$${subtotal.toFixed(2)}`;
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
// 5. SECURE CHECKOUT POPUP DIALOG ARCHITECTURE
// ==========================================

window.toggleCheckoutModal = function (showFlag) {
  const modal = document.getElementById("checkout-modal");
  const modalBody = document.getElementById("modal-body");
  if (!modal || !modalBody) return;

  if (showFlag) {
    // Populate tiny mini preview dashboard breakdown lists inside form cards
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
        <span class="font-bold text-slate-900">$${cost.toFixed(2)}</span>
      </div>
    `;
  });

  if (mSubtotal) mSubtotal.textContent = `$${totalCash.toFixed(2)}`;
  if (mTotal) mTotal.textContent = `$${totalCash.toFixed(2)}`;
}

window.handleOrderSubmission = function (event) {
  // 1. Prevent the form from refreshing or redirecting to a fake/empty action URL
  event.preventDefault();

  const formElement = event.target;

  // 2. Gather input values from your checkout form fields
  const nameField = formElement.querySelector('input[name="Client Name"]');
  const addressField = formElement.querySelector(
    'input[name="Street Address"]',
  );
  const cityField = formElement.querySelector('input[name="City"]');

  // 3. Formulate a clean Order History Record object
  const newOrder = {
    orderId: "BZ-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    customerName: nameField ? nameField.value : "Customer",
    deliveryAddress: `${addressField ? addressField.value : ""}, ${cityField ? cityField.value : ""}`,
    items: [...cart],
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };

  // 4. Stash this order data entry safely into your local storage database history
  let orderHistory = JSON.parse(localStorage.getItem("bagzone_orders")) || [];
  orderHistory.unshift(newOrder);
  localStorage.setItem("bagzone_orders", JSON.stringify(orderHistory));

  // 5. Clear items out of your active shopping cart state now that it's ordered
  cart = [];
  localStorage.setItem("bagzone_cart", JSON.stringify(cart));
  updateCartBadge();

  // 6. Jump directly to the tracking dashboard page without any alert interruption
  window.location.href = "orders.html";
};

// ==========================================
// 6. STREAMLINED REAL-TIME FILTER ENGINE
// ==========================================

function applyFilters() {
  const searchInput = document.getElementById("catalog-search");
  const minPriceInput = document.getElementById("filter-min-price");
  const maxPriceInput = document.getElementById("filter-max-price");

  // Safety exit if running code outside index.html boundaries
  if (!searchInput || !minPriceInput || !maxPriceInput) return;

  const query = searchInput.value.toLowerCase().trim();
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

  // Filter master PRODUCTS array on every keystroke/keystep changes
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
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
          />
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
              <span class="text-base font-black text-slate-900">$${product.price.toFixed(2)}</span>
            </div>
            <button onclick="addToCart('${product.id}')" class="bg-[#2bc4c3] hover:bg-[#229e9d] text-white font-bold px-3 py-2 rounded-xl text-xs tracking-wide shadow-sm transition">Add To Cart 🎒</button>
          </div>
        </div>
      </div>
    `;
  });
}

// ==========================================
// 7. ORDER HISTORY DASHBOARD GENERATOR (orders.html)
// ==========================================
function renderOrdersPage() {
  const container = document.getElementById("orders-log-container");
  if (!container) return; // Exit if user isn't currently viewing orders.html

  // Pull historical logs from browser local storage boundaries
  const orders = JSON.parse(localStorage.getItem("bagzone_orders")) || [];

  container.innerHTML = "";

  // Case A: No previous orders found
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

  // Case B: Orders exist, map them out into clean cards
  orders.forEach((order) => {
    // Generate markup details for each individual bag inside this order
    const itemsMarkup = order.items
      .map(
        (item) => `
      <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
        <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
        </div>
        <div class="flex-grow">
          <h5 class="text-xs font-bold text-slate-900">${item.name}</h5>
          <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">${item.color} <strong class="text-slate-700 font-black">x${item.quantity}</strong></span>
        </div>
        <span class="text-xs font-black text-slate-900">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `,
      )
      .join("");

    container.innerHTML += `
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Order Reference ID</span>
            <span class="font-black text-slate-900 font-mono">${order.orderId}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Date Placed</span>
            <span class="font-bold text-slate-700">${order.date}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Status Tracking</span>
            <span class="bg-emerald-100 text-emerald-700 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase inline-block animate-pulse">Processing</span>
          </div>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div class="md:col-span-2 space-y-1">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Items Purchased</span>
            ${itemsMarkup}
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
            <div>
              <span class="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Shipping Destination</span>
              <strong class="text-slate-900 block mt-0.5">${order.customerName}</strong>
              <p class="text-slate-500 text-[11px] leading-tight">${order.deliveryAddress}</p>
            </div>
            <div class="border-t border-slate-200/60 pt-2 mt-2 flex justify-between items-baseline">
              <span class="text-slate-900 font-black">Amount Settled</span>
              <span class="text-base font-black text-[#2bc4c3]">$${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}
