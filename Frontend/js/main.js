import { API_BASE_URL, apiFetch, getImageUrl } from './api.js';
import { showToast, showConfirmModal } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    // --- 0. ROUTE GUARD ---
    if ((path.includes("ListItem.html") || path.includes("dashboard") || path.includes("Dashboard")) && !userId) {
        showToast("Please login to access this page.", "info");
        window.location.href = "auth.html";
        return;
    }

    // --- 1. ELEMENT SELECTORS ---
    const authForm = document.getElementById("authForm");
    const topPicksScroll = document.getElementById("top-picks-scroll");
    const myItemsList = document.getElementById("myItemsList");
    const requestList = document.getElementById("requestList");
    const listItemForm = document.getElementById("listItemForm");
    const reserveBtn = document.getElementById("reserveBtn");
    const loginLink = document.querySelector(".login-link");

    // --- 2. SESSION & HEADER UI ---
    if (loginLink && userName) {
        loginLink.innerHTML = `
            <a href="Dashboard.html" id="navUserName" style="text-decoration:none; color:inherit; font-weight:700;">${userName}</a>
            <span id="logoutBtn" style="margin-left:8px; cursor:pointer; color:#ef4444; font-size:12px; font-weight:600;">(Logout)</span>
        `;
        loginLink.removeAttribute("href");
        document.getElementById("logoutBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "index.html";
        });
    }

    // --- DASHBOARD GREETING ---
    const dashGreeting = document.getElementById("dashGreeting");
    if (dashGreeting && userName) {
        dashGreeting.textContent = `Welcome back, ${userName}! 👋`;
    }

    // --- NOTIFICATION BADGE (WhatsApp-style count on Dashboard link) ---
    const navNotifBadge = document.getElementById("navNotifBadge");
    if (navNotifBadge && userId) {
        const fetchNotifCount = async () => {
            try {
                const res = await apiFetch(`${API_BASE_URL}/notifications/count/${userId}`);
                const data = await res.json();
                if (data.success && data.total > 0) {
                    navNotifBadge.textContent = data.total > 99 ? '99+' : data.total;
                    navNotifBadge.classList.add('visible');
                } else {
                    navNotifBadge.classList.remove('visible');
                }
            } catch (err) {
                console.error("Notification badge fetch error:", err);
            }
        };
        fetchNotifCount();
    }

    // --- 3. HOME PAGE: FETCH ALL ITEMS ---
    if (topPicksScroll) {
        const fetchHomeItems = async (category = 'All') => {
            try {
                const selectedCategory = category.trim();
                let url = (selectedCategory === 'All' || selectedCategory === '')
                    ? `${API_BASE_URL}/items/all`
                    : `${API_BASE_URL}/items/all?category=${selectedCategory}`;

                // Hide logged-in user's own items from discovery
                if (userId) {
                    url += url.includes('?') ? `&excludeUser=${userId}` : `?excludeUser=${userId}`;
                }

                const response = await apiFetch(url);
                const result = await response.json();

                if (result.success) {
                    topPicksScroll.innerHTML = result.data.map(item => {
                        const isAvailable = item.status === 'available';
                        return `
                        <div class="item-card-scroll ${!isAvailable ? 'item-unavailable' : ''}" onclick="window.location.href='Borrow.html?id=${item.id}'" style="cursor: pointer; transition: transform 0.2s;">
                            <span class="badge top-pick-badge ${!isAvailable ? 'badge-unavailable' : ''}">${isAvailable ? 'NEW' : 'UNAVAILABLE'}</span>
                            <div class="card-img-wrapper" style="background-image: url('${getImageUrl(item.image_url, 'https://via.placeholder.com/300')}');background-size:cover;background-position:center;"></div>
                            <div class="item-name">${item.item_name}</div>
                            <div class="card-meta">
                                <span><span class="rating">5.0 ★</span> (0)</span>
                            </div>
                            <div class="card-location">
                                <span class="loc-pin">📍</span> ${item.locality || "Nearby"} <span class="community-tag">Community</span>
                            </div>
                            <div class="price-row">
                                <span class="price">₹${item.price_per_day}<small>/day</small></span>
                                ${isAvailable
                                ? `<a href="Borrow.html?id=${item.id}" class="borrow-btn">Borrow</a>`
                                : `<span class="borrow-btn borrow-btn-disabled">Unavailable</span>`
                            }
                            </div>
                        </div>
                    `}).join('');
                } else {
                    topPicksScroll.innerHTML = '<p style="color:var(--slate-500);text-align:center;width:100%;padding:40px 0;">No items found.</p>';
                }
            } catch (error) {
                console.error("Home fetch error:", error);
                topPicksScroll.innerHTML = '<p style="color:var(--slate-500);text-align:center;width:100%;padding:40px 0;">Unable to load items. Please check your connection.</p>';
            }
        };
        fetchHomeItems();

        // CATEGORY FILTERING
        const categoryBar = document.getElementById("categoryBar");
        if (categoryBar) {
            categoryBar.addEventListener("click", (e) => {
                const chip = e.target.closest(".category-item");
                if (!chip) return;
                e.preventDefault();
                document.querySelectorAll(".category-item").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                const cat = chip.dataset.category || 'All';
                fetchHomeItems(cat);
            });
        }

        // SEARCH BAR
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener("input", () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = searchInput.value.trim().toLowerCase();
                    const cards = topPicksScroll.querySelectorAll(".item-card-scroll");
                    cards.forEach(card => {
                        const name = card.querySelector(".item-name")?.textContent.toLowerCase() || '';
                        card.style.display = (!query || name.includes(query)) ? '' : 'none';
                    });

                    if (query && topPicksScroll) {
                        topPicksScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
            });
        }
    }

    // --- 4. BORROW PAGE LOGIC ---
    if (path.toLowerCase().includes("borrow.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        let pricePerDay = 0;

        const calculateTotal = () => {
            const startInput = document.getElementById("startDate").value;
            const endInput = document.getElementById("endDate").value;
            if (startInput && endInput) {
                const start = new Date(startInput);
                const end = new Date(endInput);
                if (end > start) {
                    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
                    const securityDeposit = 5000;
                    const total = (diffDays * pricePerDay) + securityDeposit;
                    document.getElementById("duration-text").innerText = `${diffDays} Days`;
                    document.getElementById("total-text").innerText = `₹${total.toLocaleString()}`;
                }
            }
        };

        const fetchItemDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
                const result = await response.json();
                if (result.success) {
                    const item = result.data;
                    pricePerDay = parseFloat(item.price_per_day) || 0;
                    document.querySelector(".item-main-image").src = getImageUrl(item.image_url, 'https://via.placeholder.com/600');
                    document.querySelector(".item-title").innerText = item.item_name;
                    document.querySelector(".item-description").innerText = item.description;
                    document.querySelector(".price-amount").innerText = `₹${pricePerDay}`;
                    document.querySelector(".owner-name").innerText = item.owner_name || "Neighbor";
                    const locEl = document.getElementById("itemLocality");
                    if (locEl) locEl.innerText = `${item.locality || "Nearby"} (Approximate)`;
                    calculateTotal();
                }
            } catch (error) { console.error("Borrow fetch error:", error); }
        };

        document.getElementById("startDate").addEventListener("change", calculateTotal);
        document.getElementById("endDate").addEventListener("change", calculateTotal);
        fetchItemDetails();
    }

    // --- 5. DASHBOARD LOGIC ---
    if (path.toLowerCase().includes("dashboard.html")) {
        const currentUserId = parseInt(userId);
        const borrowerRequestList = document.getElementById("borrowerRequestList");

        // Hoist to window for access from global action handlers (instant refresh)
        const fetchBorrowerRequests = window._fetchBorrowerRequests = async () => {
            try {
                const response = await apiFetch(`${API_BASE_URL}/borrower/requests/${currentUserId}`);
                const result = await response.json();
                if (result.success && result.data.length > 0) {
                    const statBorrowed = document.getElementById("statBorrowed");
                    // Count active borrows (accepted + collected)
                    const activeBorrows = result.data.filter(r => ['accepted', 'collected'].includes(r.request_status));
                    if (statBorrowed) statBorrowed.textContent = activeBorrows.length;

                    borrowerRequestList.innerHTML = result.data.map(req => {
                        const isOverdue = req.is_overdue;
                        const displayStatus = isOverdue ? 'overdue' : req.request_status;
                        const showAddress = ['accepted', 'collected'].includes(req.request_status);

                        return `
                        <div class="dash-item-card ${showAddress ? 'dash-card-clickable' : ''}" 
                             style="border-left: 4px solid ${getStatusColor(displayStatus)};" 
                             ${showAddress ? `onclick="togglePickupAddress(this, ${req.id}, ${currentUserId})"` : ''}>
                            <div class="dash-item-left">
                                <div>
                                    <strong>${req.item_name}</strong>
                                    <span style="display:block; font-size:13px; color:var(--slate-500);">Owner: ${req.owner_name}</span>
                                    <small style="color:var(--slate-400);">${new Date(req.start_date).toLocaleDateString()} — ${new Date(req.end_date).toLocaleDateString()}</small>
                                    ${showAddress ?
                                `<div class="dash-pickup-info available">
                                            <span class="loc-pin">📍</span> Tap to view pickup address
                                            <span class="pickup-arrow">▼</span>
                                        </div>` :
                                req.request_status === 'rejected' ?
                                    `<div class="dash-pickup-info hidden-addr"><span class="lock-icon">❌</span> Request was declined</div>` :
                                    req.request_status === 'cancelled' ?
                                        `<div class="dash-pickup-info hidden-addr"><span class="lock-icon">🚫</span> Auto-cancelled (No-show)</div>` :
                                        req.request_status === 'returned' ?
                                            `<div class="dash-pickup-info hidden-addr"><span class="lock-icon">✅</span> Item successfully returned</div>` :
                                            `<div class="dash-pickup-info hidden-addr"><span class="lock-icon">🔒</span> Exact address hidden until approved</div>`
                            }
                                </div>
                            </div>
                            <div class="dash-item-right">
                                ${getBorrowerAction(req, displayStatus, currentUserId)}
                            </div>
                        </div>
                        ${showAddress ? `<div class="pickup-address-panel" id="pickup-panel-${req.id}"></div>` : ''}
                    `;
                    }).join('');
                } else {
                    borrowerRequestList.innerHTML = "<p style='color:var(--slate-500);'>You haven't requested any items yet.</p>";
                }
            } catch (error) { console.error("Borrower fetch error:", error); }
        };

        // Determine what action/badge to show for borrower dashboard
        const getBorrowerAction = (req, displayStatus, userId) => {
            switch (displayStatus) {
                case 'pending':
                    return `<span class="status-badge status-pending">⏳ Pending</span>`;
                case 'accepted':
                    return `<button onclick="event.stopPropagation(); markCollected(${req.id}, ${userId})" class="btn-collect">📦 Mark as Collected</button>`;
                case 'collected':
                    return `<button onclick="event.stopPropagation(); markReturned(${req.id}, ${userId})" class="btn-return">↩️ Mark as Returned</button>`;
                case 'overdue':
                    return `<button onclick="event.stopPropagation(); markReturned(${req.id}, ${userId})" class="btn-return-urgent">🔴 Overdue — Return Now</button>`;
                case 'returned':
                    return `<span class="status-badge status-returned">✅ Returned</span>`;
                case 'rejected':
                    return `<span class="status-badge status-rejected">❌ Rejected</span>`;
                case 'cancelled':
                    return `<span class="status-badge status-rejected">🚫 Cancelled</span>`;
                default:
                    return `<span class="status-badge status-pending">${req.request_status}</span>`;
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'accepted': return '#059669';
                case 'rejected': return '#dc2626';
                case 'collected': return '#1d4ed8';
                case 'returned': return '#059669';
                case 'overdue': return '#dc2626';
                default: return '#d97706';
            }
        };

        const getStatusBg = (status) => {
            switch (status) {
                case 'accepted': return '#d1fae5';
                case 'rejected': return '#fee2e2';
                case 'collected': return '#dbeafe';
                case 'returned': return '#d1fae5';
                case 'overdue': return '#fee2e2';
                default: return '#fef3c7';
            }
        };

        // Hoist to window for access from global action handlers (instant refresh)
        const fetchDashboardData = window._fetchDashboardData = async () => {
            try {
                const itemsRes = await apiFetch(`${API_BASE_URL}/lender/my-items/${currentUserId}`);
                const itemsResult = await itemsRes.json();
                if (itemsResult.success && itemsResult.data.length > 0) {
                    const statListed = document.getElementById("statListed");
                    if (statListed) statListed.textContent = itemsResult.data.length;

                    myItemsList.innerHTML = itemsResult.data.map(item => `
                        <div class="dash-item-card" onclick="window.openUpdateModal(${item.id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.price_per_day})" style="cursor: pointer; transition: background 0.2s; border: 1px solid transparent;" onmouseover="this.style.border='1px solid var(--primary)'" onmouseout="this.style.border='1px solid transparent'">
                            <div class="dash-item-left">
                                <strong>${item.item_name}</strong>
                            </div>
                            <div class="dash-item-right">
                                <span style="font-weight:700; color:var(--slate-800);">₹${item.price_per_day}/day</span>
                            </div>
                        </div>
                    `).join('');
                } else { myItemsList.innerHTML = "<p style='color:var(--slate-500);'>No items listed yet.</p>"; }

                const reqRes = await apiFetch(`${API_BASE_URL}/lender/dashboard/${currentUserId}`);
                const reqResult = await reqRes.json();
                if (reqResult.success && reqResult.data.length > 0) {
                    const statRequests = document.getElementById("statRequests");
                    if (statRequests) statRequests.textContent = reqResult.data.filter(r => r.request_status === 'pending').length;

                    requestList.innerHTML = reqResult.data.map(req => {
                        const isOverdue = req.is_overdue;
                        const displayStatus = isOverdue ? 'overdue' : req.request_status;

                        return `
                        <div class="dash-item-card" style="border-left: 4px solid ${getStatusColor(displayStatus)};">
                            <div class="dash-item-left">
                                <div>
                                    <strong>${req.item_name}</strong>
                                    <span style="display:block; font-size:13px; color:var(--slate-500);">Borrower: ${req.borrower_name}</span>
                                    <small style="color:var(--slate-400);">${new Date(req.start_date).toLocaleDateString()} to ${new Date(req.end_date).toLocaleDateString()}</small>
                                    ${getLenderStatusHint(displayStatus)}
                                </div>
                            </div>
                            <div class="dash-item-right">
                                ${getLenderAction(req, displayStatus)}
                            </div>
                        </div>
                    `;
                    }).join('');
                } else { requestList.innerHTML = "<p style='color:var(--slate-500);'>No pending requests.</p>"; }
            } catch (error) { console.error("Dashboard Load Error:", error); }
        };

        // Lender-side status hints (shown below dates)
        const getLenderStatusHint = (status) => {
            switch (status) {
                case 'pending':
                    return `<div class="dash-pickup-info hidden-addr"><span class="note-icon">🛡️</span> Your address is hidden until you accept</div>`;
                case 'accepted':
                    return `<div class="dash-pickup-info available"><span class="note-icon">⏳</span> Waiting for borrower to collect</div>`;
                case 'collected':
                    return `<div class="dash-pickup-info available"><span class="note-icon">📦</span> Item is currently with borrower</div>`;
                case 'overdue':
                    return `<div class="dash-pickup-info" style="color:#dc2626;font-weight:700;"><span class="note-icon">🔴</span> Overdue — borrower has not returned yet</div>`;
                case 'returned':
                    return `<div class="dash-pickup-info available"><span class="note-icon">✅</span> Item has been returned</div>`;
                case 'rejected':
                    return `<div class="dash-pickup-info hidden-addr"><span class="note-icon">❌</span> You declined this request</div>`;
                case 'cancelled':
                    return `<div class="dash-pickup-info hidden-addr"><span class="note-icon">🚫</span> Auto-cancelled (Borrower did not collect)</div>`;
                default:
                    return '';
            }
        };

        // Lender-side action buttons/badges
        const getLenderAction = (req, displayStatus) => {
            switch (displayStatus) {
                case 'pending':
                    return `
                        <button onclick="updateStatus(${req.id}, 'accepted')" class="btn-accept">Accept</button>
                        <button onclick="updateStatus(${req.id}, 'rejected')" class="btn-reject">Reject</button>
                    `;
                case 'accepted':
                    return `<span class="lifecycle-status-msg lifecycle-waiting">⏳ Awaiting Collection</span>`;
                case 'collected':
                    return `<span class="lifecycle-status-msg lifecycle-borrowed">📦 Currently Borrowed</span>`;
                case 'overdue':
                    return `<span class="status-badge status-overdue">🔴 OVERDUE</span>`;
                case 'returned':
                    return `<span class="lifecycle-status-msg lifecycle-returned">✅ Returned</span>`;
                case 'rejected':
                    return `<span class="status-badge status-rejected">❌ Rejected</span>`;
                case 'cancelled':
                    return `<span class="status-badge status-rejected">🚫 Cancelled</span>`;
                default:
                    return `<span class="status-badge" style="background:${getStatusBg(req.request_status)};color:${getStatusColor(req.request_status)};">${req.request_status}</span>`;
            }
        };
        fetchDashboardData();
        fetchBorrowerRequests();
    }

    // --- 6. AUTHENTICATION LOGIC ---
    const toggleAuthLink = document.getElementById("toggleAuthLink");
    const signupFields = document.getElementById("signupFields");
    const authTitle = document.getElementById("authTitle");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const toggleText = document.getElementById("toggleText");

    if (toggleAuthLink) {
        toggleAuthLink.addEventListener("click", (e) => {
            e.preventDefault();
            const isLogin = authTitle.innerText === "Login";
            authTitle.innerText = isLogin ? "Sign Up" : "Login";
            authSubmitBtn.innerText = isLogin ? "Sign Up" : "Login";
            toggleText.innerText = isLogin ? "Already have an account?" : "Don't have an account?";
            toggleAuthLink.innerText = isLogin ? "Login" : "Sign Up";
            signupFields.style.display = isLogin ? "block" : "none";
            document.getElementById("authName").required = isLogin;
            document.getElementById("authPhone").required = isLogin;
        });
    }

    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const isSignup = authTitle.innerText === "Sign Up";
            const endpoint = isSignup ? '/auth/register' : '/auth/login';
            const payload = {
                email: document.getElementById("authEmail").value,
                password: document.getElementById("authPassword").value
            };
            if (isSignup) {
                payload.name = document.getElementById("authName").value;
                payload.phone = document.getElementById("authPhone").value;
                payload.locality = document.getElementById("authLocality").value;
                payload.pincode = document.getElementById("authPincode").value;
                payload.address = document.getElementById("authAddress").value;
                payload.role = 'lender';
            }
            try {
                const response = await apiFetch(`${API_BASE_URL}${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    if (result.token) localStorage.setItem("token", result.token);
                    localStorage.setItem("userId", result.userId || result.user.id);
                    localStorage.setItem("userName", result.name || result.user.name);
                    showToast(isSignup ? "Account Created!" : "Logged In!", "success");
                    setTimeout(() => window.location.href = "index.html", 1000);
                } else { showToast("Error: " + result.error, "error"); }
            } catch (error) {
                console.error("Auth Error:", error);
                showToast("Connection to server failed.", "error");
            }
        });
    }

    // --- 7. RESERVE BUTTON ---
    // Helper: show inline feedback on borrow page
    const showBorrowFeedback = (message, type) => {
        const fb = document.getElementById("borrowFeedback");
        if (!fb) return;
        fb.textContent = message;
        fb.className = `borrow-feedback ${type}`; // removes 'hidden', adds 'success' or 'error'
    };

    if (reserveBtn) {
        reserveBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const startVal = document.getElementById("startDate").value;
            const endVal = document.getElementById("endDate").value;
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id');

            // Client-side date validation
            if (!startVal || !endVal) {
                showBorrowFeedback("Please select both Start and End dates.", "error");
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            if (startVal < today) {
                showBorrowFeedback("Start date cannot be in the past.", "error");
                return;
            }
            if (endVal <= startVal) {
                showBorrowFeedback("End date must be after the start date.", "error");
                return;
            }
            if (!userId) {
                showBorrowFeedback("Please login to borrow items.", "error");
                return;
            }

            const borrowData = {
                item_id: parseInt(itemId),
                borrower_id: parseInt(userId),
                start_date: startVal,
                end_date: endVal
            };
            try {
                const response = await apiFetch(`${API_BASE_URL}/borrow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(borrowData)
                });
                const result = await response.json();
                if (result.success) {
                    showBorrowFeedback("✅ Request sent successfully! Check your dashboard for updates.", "success");
                    reserveBtn.innerText = "✓ Requested";
                    reserveBtn.disabled = true;
                    reserveBtn.style.opacity = "0.6";
                } else {
                    showBorrowFeedback("❌ " + result.error, "error");
                }
            } catch (error) {
                showBorrowFeedback("❌ Server connection failed. Please try again.", "error");
            }
        });
    }

    // --- 8. LIST ITEM FORM ---
    if (listItemForm) {
        const imageFile = document.getElementById("imageFile");
        const imgPreview = document.getElementById("imgPreview");
        if (imageFile && imgPreview) {
            imageFile.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imgPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    imgPreview.innerHTML = '<span>Image preview will appear here</span>';
                }
            });
        }

        listItemForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!userId) { showToast("Please login first!", "info"); return; }

            const formData = new FormData();
            formData.append("item_name", document.getElementById("itemName").value);
            formData.append("category", document.getElementById("category").value);
            formData.append("price_per_day", document.getElementById("price").value);
            formData.append("description", document.getElementById("description").value);
            formData.append("user_id", userId);

            if (imageFile && imageFile.files[0]) {
                formData.append("image", imageFile.files[0]);
            }

            try {
                // When using FormData, do NOT set Content-Type header manually.
                // Fetch will automatically set it with the correct boundary.
                const response = await fetch(`${API_BASE_URL}/lender/list-item`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Item listed successfully!", "success");
                    setTimeout(() => window.location.href = "Dashboard.html", 1000);
                } else { showToast("Error: " + result.error, "error"); }
            } catch (error) { showToast("Server connection failed.", "error"); }
        });
    }

    // Update Item Logic
    window.openUpdateModal = (id, name, price) => {
        document.getElementById("updateItemId").value = id;
        document.getElementById("updateItemName").value = name;
        document.getElementById("updateItemPrice").value = price;
        const modal = document.getElementById("updateItemModal");
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    const updateItemForm = document.getElementById("updateItemForm");
    if (updateItemForm) {
        updateItemForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const itemId = document.getElementById("updateItemId").value;
            const formData = new FormData();
            formData.append("item_name", document.getElementById("updateItemName").value);
            formData.append("price_per_day", document.getElementById("updateItemPrice").value);

            const imageFile = document.getElementById("updateItemImage");
            if (imageFile && imageFile.files[0]) {
                formData.append("image", imageFile.files[0]);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/lender/item/${itemId}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Item updated successfully!", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast("Error: " + result.error, "error");
                }
            } catch (error) {
                showToast("Server connection failed.", "error");
            }
        });
    }

    const deleteItemBtn = document.getElementById("deleteItemBtn");
    if (deleteItemBtn) {
        deleteItemBtn.addEventListener("click", async () => {
            const itemId = document.getElementById("updateItemId").value;
            if (!itemId) return;

            showConfirmModal({
                heading: "Remove Listing?",
                message: "Are you sure you want to remove this item listing?\nThis action cannot be undone.",
                confirmText: "Remove Item",
                cancelText: "Keep Listing",
                onConfirm: async () => {
                    try {
                        const response = await apiFetch(`${API_BASE_URL}/lender/item/${itemId}`, { method: "DELETE" });
                        const result = await response.json();
                        if (result.success) {
                            showToast("Item removed successfully.", "success");
                            setTimeout(() => window.location.reload(), 1000);
                        } else {
                            showToast("Error: " + result.error, "error");
                        }
                    } catch (error) {
                        showToast("Server connection failed.", "error");
                    }
                }
            });
        });
    }

    // --- 9. CHATBOT UI ---
    const chatFab = document.getElementById("chatFab");
    const aiAssistantBtn = document.getElementById("aiAssistantBtn");
    const chatbotPanel = document.getElementById("chatbotPanel");
    const closeChatbotBtn = document.getElementById("closeChatbotBtn");
    const chatInput = document.getElementById("chatInput");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatMessages = document.getElementById("chatMessages");
    const suggestionButtons = document.querySelectorAll(".suggestion-btn");

    const appendMessage = (text, sender) => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(sender === "user" ? "user-message" : "bot-message");
        messageDiv.innerText = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const appendItemSuggestions = (items) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("bot-message");
        wrapper.style.marginTop = "8px";
        const title = document.createElement("div");
        title.innerText = "Available items:";
        title.style.fontWeight = "700";
        title.style.marginBottom = "10px";
        wrapper.appendChild(title);
        items.forEach((item) => {
            const link = document.createElement("a");
            link.href = `Borrow.html?id=${item.id}`;
            link.innerText = `${item.item_name} — ₹${item.price_per_day}/day`;
            link.style.cssText = "display:block;margin-bottom:8px;color:var(--primary);font-weight:600;font-size:13px;";
            link.addEventListener("mouseover", () => link.style.textDecoration = "underline");
            link.addEventListener("mouseout", () => link.style.textDecoration = "none");
            wrapper.appendChild(link);
        });
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessageToAssistant = async (message) => {
        try {
            const response = await apiFetch(`${API_BASE_URL}/assistant/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });
            const result = await response.json();
            if (result.success) {
                appendMessage(result.reply, "bot");
                if (result.items && result.items.length > 0) appendItemSuggestions(result.items);
            } else { appendMessage("Sorry, I could not understand that.", "bot"); }
        } catch (error) {
            console.error("Assistant Fetch Error:", error);
            appendMessage("Server connection failed for the assistant.", "bot");
        }
    };

    const handleUserMessage = (message) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;
        appendMessage(trimmedMessage, "user");
        chatInput.value = "";
        sendMessageToAssistant(trimmedMessage);
    };

    //10.Fetch nearby items
    const openChat = () => { if (chatbotPanel) chatbotPanel.classList.remove("hidden"); };
    const closeChat = () => { if (chatbotPanel) chatbotPanel.classList.add("hidden"); };

    if (chatFab) chatFab.addEventListener("click", openChat);
    if (aiAssistantBtn) aiAssistantBtn.addEventListener("click", (e) => { e.preventDefault(); openChat(); });
    if (closeChatbotBtn) closeChatbotBtn.addEventListener("click", closeChat);

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener("click", () => handleUserMessage(chatInput.value));
        chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleUserMessage(chatInput.value); });
    }
    if (suggestionButtons.length > 0) {
        suggestionButtons.forEach((btn) => btn.addEventListener("click", () => handleUserMessage(btn.innerText)));
    }

    const fetchNearbyItems = async () => {
        try {
            const userId = localStorage.getItem("userId");

            if (!userId) {
                console.log("No logged in user, cannot fetch nearby items.");
                return;
            }

            const response = await apiFetch(`${API_BASE_URL}/items/nearby/${userId}`);
            const result = await response.json();

            if (result.success) {
                topPicksScroll.innerHTML = result.data.map(item => `
                <div class="item-card-scroll" onclick="window.location.href='Borrow.html?id=${item.id}'" style="cursor: pointer; transition: transform 0.2s;">
                    <span class="badge top-pick-badge">NEARBY</span>
                    <div class="card-img-wrapper" style="background-image: url('${getImageUrl(item.image_url, 'https://via.placeholder.com/300')}'); background-size: cover; background-position: center;"></div>
                    <div class="item-name">${item.item_name}</div>
                    <div class="card-meta">
                        <span><span class="rating">5.0 ★</span> Verified</span>
                        <span style="color:var(--slate-500)">${item.distance_km} km away</span>
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin: 6px 0;">
                        📍 ${item.locality}
                    </div>
                    <div class="price-row">
                        <span class="price">₹${item.price_per_day}<small>/day</small></span>
                        <a href="borrow.html?id=${item.id}" class="borrow-btn">Borrow</a>
                    </div>
                </div>
            `).join("");
            } else {
                topPicksScroll.innerHTML = "<p>No nearby items found.</p>";
            }
        } catch (error) {
            console.error("Nearby items fetch error:", error);
            topPicksScroll.innerHTML = "<p>Failed to load nearby items.</p>";
        }
    };

    // --- 11. LEAFLET MAP (Community Circle) - Dynamic ---
    const mapEl = document.getElementById("community-map");
    if (mapEl && typeof L !== 'undefined') {
        const fallbackCenter = [19.0760, 72.8777]; // Mumbai fallback
        const map = L.map('community-map', { scrollWheelZoom: false }).setView(fallbackCenter, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const categoryIcons = {
            utility_tools: '🔧', hardware: '🔩', electronics: '📱',
            camping: '⛺', gaming: '🎮', home_appliances: '🏠', kitchen: '🍳'
        };

        const greenIcon = L.divIcon({
            html: '<div class="map-marker-dot"></div>',
            className: 'map-marker-wrapper', iconSize: [20, 20], iconAnchor: [10, 10]
        });

        const userIcon = L.divIcon({
            html: '<div class="map-user-dot"><div class="map-user-pulse"></div></div>',
            className: 'map-marker-wrapper', iconSize: [24, 24], iconAnchor: [12, 12]
        });

        const nearbyItemsList = document.getElementById("nearbyItemsList");

        const initCommunityMap = async () => {
            const mapUserId = localStorage.getItem("userId");

            if (!mapUserId) {
                // Not logged in: show fallback with message
                L.circle(fallbackCenter, { radius: 800, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 2, dashArray: '8 6' }).addTo(map);
                L.marker(fallbackCenter, { icon: userIcon }).addTo(map)
                    .bindPopup('<div class="map-popup-title">📍 Community Center</div><div class="map-popup-approx">Login to see nearby items</div>').openPopup();
                if (nearbyItemsList) {
                    nearbyItemsList.innerHTML = '<div class="map-empty-state"><span>🔒</span><p>Login to discover items near you</p><a href="auth.html" class="map-empty-cta">Login / Sign Up</a></div>';
                }
                return;
            }

            try {
                const response = await apiFetch(`${API_BASE_URL}/location/items/nearby/${mapUserId}`);
                const result = await response.json();

                if (!result.success) {
                    console.error("Nearby items error:", result.error);
                    if (nearbyItemsList) {
                        nearbyItemsList.innerHTML = '<div class="map-empty-state"><span>📍</span><p>Unable to load nearby items. Make sure your location is set in your profile.</p></div>';
                    }
                    return;
                }

                const userLat = result.user_latitude;
                const userLng = result.user_longitude;
                const userLocality = result.user_locality || "Your Location";
                const items = result.data || [];

                // Center map on user's real location
                const userCenter = [userLat, userLng];
                map.setView(userCenter, 14);

                // Draw community radius circle
                L.circle(userCenter, {
                    radius: 2000,
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.06,
                    weight: 2,
                    dashArray: '8 6'
                }).addTo(map);

                // Inner glow circle
                L.circle(userCenter, {
                    radius: 800,
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '4 4'
                }).addTo(map);

                // User center marker
                L.marker(userCenter, { icon: userIcon }).addTo(map)
                    .bindPopup(`<div class="map-popup-title">📍 You are here</div><div class="map-popup-approx">${userLocality}</div>`);


                // Plot item markers at their real coordinates
                items.forEach(item => {
                    if (!item.latitude || !item.longitude) return;

                    const marker = L.marker([item.latitude, item.longitude], { icon: greenIcon }).addTo(map);
                    const catIcon = categoryIcons[item.category] || '📦';
                    const popupContent = `
                        <div class="map-popup-content">
                            <div class="map-popup-title">${item.item_name}</div>
                            <div class="map-popup-cat">${catIcon} ${item.category ? item.category.replace(/_/g, ' ') : 'General'}</div>
                            <div class="map-popup-locality">📍 ${item.locality || 'Nearby'}</div>
                            <div class="map-popup-dist">${item.distance_km} km away</div>
                            <div class="map-popup-price">₹${item.price_per_day}/day</div>
                            <div class="map-popup-approx">🔒 Approximate location shown</div>
                            <a href="Borrow.html?id=${item.id}" class="map-popup-action">Borrow Now →</a>
                        </div>
                    `;
                    marker.bindPopup(popupContent, { maxWidth: 240, className: 'map-custom-popup' });
                });

                // Auto-fit bounds if items exist
                if (items.length > 0) {
                    const allPoints = [[userLat, userLng], ...items.filter(i => i.latitude && i.longitude).map(i => [i.latitude, i.longitude])];
                    map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 15 });
                }

                // Render sidebar nearby items list
                if (nearbyItemsList) {
                    if (items.length === 0) {
                        nearbyItemsList.innerHTML = '<div class="map-empty-state"><span>🔍</span><p>No nearby items found yet. Check back soon!</p></div>';
                    } else {
                        const topItems = items.sort((a, b) => a.distance_km - b.distance_km).slice(0, 5);
                        nearbyItemsList.innerHTML = topItems.map(item => {
                            const catIcon = categoryIcons[item.category] || '📦';
                            return `
                                <a href="Borrow.html?id=${item.id}" class="nearby-item nearby-item-link">
                                    <div class="nearby-item-icon">${catIcon}</div>
                                    <div class="nearby-item-info">
                                        <strong>${item.item_name}</strong>
                                        <span>${item.locality || 'Nearby'}</span>
                                    </div>
                                    <div class="nearby-item-dist">${item.distance_km} km</div>
                                </a>
                            `;
                        }).join('');
                    }
                }

            } catch (error) {
                console.error("Community map fetch error:", error);
                if (nearbyItemsList) {
                    nearbyItemsList.innerHTML = '<div class="map-empty-state"><span>⚠️</span><p>Could not connect to server. Please try again later.</p></div>';
                }
            }
        };

        initCommunityMap();
    }
});

// --- GLOBAL HELPERS ---
// Helper: re-fetch dashboard data without full page reload
const _refreshDashboard = () => {
    if (typeof window._fetchDashboardData === 'function') window._fetchDashboardData();
    if (typeof window._fetchBorrowerRequests === 'function') window._fetchBorrowerRequests();
};

window.deleteItem = async (itemId) => {
    showConfirmModal({
        heading: "Remove Listing?",
        message: "Are you sure you want to remove this item listing?\nThis action cannot be undone.",
        confirmText: "Remove Item",
        cancelText: "Keep Listing",
        onConfirm: async () => {
            try {
                const response = await apiFetch(`${API_BASE_URL}/lender/item/${itemId}`, { method: "DELETE" });
                if (response.ok) {
                    showToast("Item removed successfully.", "success");
                    if (typeof window._fetchDashboardData === 'function') {
                        window._fetchDashboardData();
                    } else {
                        setTimeout(() => location.reload(), 1000);
                    }
                }
            } catch (error) { console.error("Delete failed"); }
        }
    });
};

window.updateStatus = async (requestId, status) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/lender/request/${requestId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        });
        if (response.ok) {
            // Instant refresh — update both lender and borrower sections
            _refreshDashboard();
        }
    } catch (error) { console.error(error); }
};

// Borrower lifecycle: Mark item as collected (accepted → collected)
window.markCollected = async (requestId, borrowerId) => {
    showConfirmModal({
        heading: "Confirm Collection",
        message: "Confirm that you have collected this item?",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "#3b82f6",
        onConfirm: async () => {
            try {
                const response = await apiFetch(`${API_BASE_URL}/borrow/${requestId}/collect`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ borrower_id: borrowerId })
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Marked as collected.", "success");
                    _refreshDashboard();
                } else {
                    showToast("Error: " + result.error, "error");
                }
            } catch (error) {
                console.error("Mark collected error:", error);
                showToast("Server connection failed.", "error");
            }
        }
    });
};

// Borrower lifecycle: Mark item as returned (collected → returned)
window.markReturned = async (requestId, borrowerId) => {
    showConfirmModal({
        heading: "Confirm Return",
        message: "Confirm that you have returned this item?",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "#10b981",
        onConfirm: async () => {
            try {
                const response = await apiFetch(`${API_BASE_URL}/borrow/${requestId}/return`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ borrower_id: borrowerId })
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Marked as returned.", "success");
                    _refreshDashboard();
                } else {
                    showToast("Error: " + result.error, "error");
                }
            } catch (error) {
                console.error("Mark returned error:", error);
                showToast("Server connection failed.", "error");
            }
        }
    });
};

// Toggle pickup address panel for accepted borrow requests
window.togglePickupAddress = async (cardEl, requestId, userId) => {
    const panel = document.getElementById(`pickup-panel-${requestId}`);
    if (!panel) return;

    // Toggle: if already open, close it
    if (panel.classList.contains('panel-open')) {
        panel.classList.remove('panel-open');
        panel.innerHTML = '';
        const arrow = cardEl.querySelector('.pickup-arrow');
        if (arrow) arrow.textContent = '▼';
        return;
    }

    // Show loading state
    panel.innerHTML = '<div class="pickup-loading">Loading address...</div>';
    panel.classList.add('panel-open');
    const arrow = cardEl.querySelector('.pickup-arrow');
    if (arrow) arrow.textContent = '▲';

    try {
        const response = await apiFetch(`${API_BASE_URL}/borrow/address/${requestId}/${userId}`);
        const result = await response.json();

        if (result.success && result.address_visible) {
            const d = result.data;
            panel.innerHTML = `
                <div class="pickup-address-content">
                    <div class="pickup-header">📍 Pickup Details</div>
                    <div class="pickup-row">
                        <span class="pickup-label">Owner</span>
                        <span class="pickup-value">${d.owner_name}</span>
                    </div>
                    <div class="pickup-row">
                        <span class="pickup-label">Phone</span>
                        <span class="pickup-value"><a href="tel:${d.owner_phone}">${d.owner_phone || 'Not available'}</a></span>
                    </div>
                    <div class="pickup-row">
                        <span class="pickup-label">Address</span>
                        <span class="pickup-value">${d.full_address || 'Not provided'}</span>
                    </div>
                    <div class="pickup-row">
                        <span class="pickup-label">Area</span>
                        <span class="pickup-value">${d.locality || ''} ${d.pincode ? '— ' + d.pincode : ''}</span>
                    </div>
                </div>
            `;
        } else {
            panel.innerHTML = `<div class="pickup-address-content"><p style="color:var(--slate-500); text-align:center;">🔒 ${result.message || 'Address not available yet'}</p></div>`;
        }
    } catch (error) {
        console.error("Address fetch error:", error);
        panel.innerHTML = '<div class="pickup-address-content"><p style="color:#dc2626; text-align:center;">⚠️ Failed to load address</p></div>';
    }
};

// --- CONTACT / FEEDBACK FORM LOGIC ---
(function () {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    const contactName = document.getElementById("contactName");
    const contactEmail = document.getElementById("contactEmail");
    const contactMessage = document.getElementById("contactMessage");
    const charCount = document.getElementById("charCount");
    const contactResult = document.getElementById("contactResult");
    const submitBtn = document.getElementById("contactSubmitBtn");

    // Auto-fill name if logged in
    const userName = localStorage.getItem("userName");
    if (userName && contactName) {
        contactName.value = userName;
    }

    // Character counter for message textarea
    if (contactMessage && charCount) {
        contactMessage.addEventListener("input", () => {
            const len = contactMessage.value.length;
            charCount.textContent = len;
            charCount.style.color = len > 900 ? '#dc2626' : len > 700 ? '#d97706' : '';
        });
    }

    // Form submission
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Hide any previous result
        contactResult.classList.add("hidden");
        contactResult.classList.remove("success", "error");

        // Show loading state
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        const payload = {
            name: contactName.value.trim(),
            email: contactEmail.value.trim(),
            category: document.getElementById("contactCategory").value,
            subject: document.getElementById("contactSubject").value.trim(),
            message: contactMessage.value.trim(),
            user_id: localStorage.getItem("userId") || null
        };

        try {
            const response = await apiFetch(`${API_BASE_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message, "success");
                contactForm.reset();
                if (charCount) charCount.textContent = "0";
                // Re-fill name if logged in
                if (userName && contactName) contactName.value = userName;
            } else {
                showToast(result.error || "Submission failed.", "error");
            }
        } catch (error) {
            console.error("Contact form error:", error);
            showToast("Server connection failed. Please try again.", "error");
        } finally {
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
        }
    });
})();