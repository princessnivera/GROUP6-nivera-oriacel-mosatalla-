import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    auth, 
    loginWithGoogle, 
    loginWithFacebook 
} from "./firebase.js";

import { getBooksFromSupabase } from "./Supabaseclient.js";


// ================= GLOBAL VARIABLES =================
let globalBooks = [];
let isRegistering = false; 

// ================= MAIN INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 System Initializing...");

    // ========== 📌 UPDATED AUTH LISTENER ==========
    if (auth) {
        auth.onAuthStateChanged((user) => {
            updateAuthUI(user);

            if (!user) {
                showLoginModal();   // ALWAYS force modal on guest
            } else {
                hideLoginModal();
            }

            document.body.classList.add('loaded');
        });
    } else {
        document.body.classList.add('loaded');
    }

    // Now run other initializations
    renderBooks();
    initializeCarousel();
    setupMobileMenu();
    setupSearchBar();
    setupScrollEffects();
    setupEventDelegation();
    setupAuthFormToggle(); 
    setupHeaderActions(); 
    setupToggles();
});

// =====================================================
// 📌 MODAL SHOW/HIDE HELPERS
// =====================================================
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.add('show');
    document.body.classList.add("auth-locked");
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove("auth-locked");
}

// ================= HEADER ACTION SETUP =================
function setupHeaderActions() {
    const accountToggle = document.getElementById("accountToggle");
    const logoutBtn = document.querySelector(".user-dropdown .logout-btn");

    // ===== 1. Account icon button =====
    if (accountToggle) {
        accountToggle.addEventListener("click", () => {
            const user = auth.currentUser;

            if (!user) {
                showLoginModal();
            } 
            // If logged in → dropdown is handled by CSS hover
        });
    }

    // ===== 2. Logout Button =====
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const user = auth.currentUser;

            if (user) {
                if (confirm(`Log out of ${user.email.split('@')[0]}?`)) {
                    await logoutUser();
                    alert("Logged out successfully.");
                    showLoginModal();  // lock screen again
                }
            } else {
                showLoginModal();
            }
        });
    }
}

// ================= AUTH UI =================
function updateAuthUI(user) {
    const loginModal = document.getElementById("loginModal");
    const accountToggle = document.getElementById("accountToggle");
    const userDropdown = document.querySelector(".user-menu .user-dropdown");
    const dropdownUserInfo = userDropdown?.querySelector(".user-info span");
    const logoutBtn = userDropdown?.querySelector(".logout-btn");
    const body = document.body;

    if (!accountToggle) return; 

    if (user) {
        console.log("✅ User authenticated:", user.email);
        body.classList.remove("auth-locked");

        const userName = user.email.split("@")[0];
        accountToggle.innerHTML = `<span>${userName}</span>`;
        accountToggle.classList.add("logged-in-active");

        if (dropdownUserInfo) dropdownUserInfo.textContent = userName;
        if (logoutBtn) logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sign Out`;

        if (loginModal) loginModal.classList.remove("show");
        
    } else {
        console.log("👤 Guest User");

        body.classList.add("auth-locked");

        accountToggle.innerHTML = `<i class="fas fa-user"></i>`;
        accountToggle.classList.remove("logged-in-active");

        if (dropdownUserInfo) dropdownUserInfo.textContent = "Guest User";
        if (logoutBtn) logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sign In`;
    }
}

// ================= AUTH FORM LOGIC =================
function setupAuthFormToggle() {
    const toggleBtn = document.getElementById("toggleAuthMode");
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const submitBtn = document.getElementById("authSubmitBtn");
    const switchText = document.getElementById("authSwitchText");
    const authForm = document.getElementById("authForm");
    const errorBox = document.getElementById("authErrorMessage");

    if (!toggleBtn) return;

    // --- SWITCH BETWEEN LOGIN / REGISTER ---
    toggleBtn.addEventListener("click", () => {
        isRegistering = !isRegistering;
        if (errorBox) errorBox.style.display = "none";

        if (isRegistering) {
            title.textContent = "Create Account";
            subtitle.textContent = "Join us to start your reading journey";
            submitBtn.textContent = "Sign Up";
            switchText.textContent = "Already have an account? ";
            toggleBtn.textContent = "Login";

            submitBtn.classList.add("btn-register");
            submitBtn.classList.remove("btn-login");
        } else {
            title.textContent = "Access Your Library";
            subtitle.textContent = "Login to access the library";
            submitBtn.textContent = "Login";
            switchText.textContent = "Don't have an account? ";
            toggleBtn.textContent = "Create Account";

            submitBtn.classList.remove("btn-register");
            submitBtn.classList.add("btn-login");
        }
    });

    // --- FORM SUBMIT ---
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("authEmail").value;
            const pass = document.getElementById("authPassword").value;

            errorBox.style.display = "none";
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing...";

            try {
                if (isRegistering) {
                    await registerUser(email, pass);
                    alert("✅ Registration successful!");
                } else {
                    await loginUser(email, pass);
                    alert("👋 Welcome back!");
                }
            } catch (err) {
                console.error(err);
                errorBox.textContent = err.message.replace("Firebase:", "");
                errorBox.style.display = "block";

                submitBtn.disabled = false;
                submitBtn.textContent = isRegistering ? "Sign Up" : "Login";
            }
        });
    }

    // --- SOCIAL LOGIN ---
    document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
        try {
            await loginWithGoogle();
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = "block";
        }
    });

    document.getElementById("facebookLoginBtn")?.addEventListener("click", async () => {
        try {
            await loginWithFacebook();
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = "block";
        }
    });

    // CLOSE BUTTON
    document.getElementById("closeLoginBtn")?.addEventListener("click", hideLoginModal);
}


// ================= BOOK RENDERING & CAROUSEL =================
async function renderBooks() {
    const container = document.getElementById("dynamicCategoriesContainer");
    if (!container) return;

    const books = await getBooksFromSupabase(); 
    if (!books || books.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px;"><p>Library is currently empty.</p></div>`;
        return;
    }

    globalBooks = books; 
    container.innerHTML = "<h2>📖 Explore by Categories</h2>"; 

    const categories = {};
    books.forEach(book => {
        const catName = book.category || "Others";
        if (!categories[catName]) categories[catName] = [];
        categories[catName].push(book);
    });

    const preferredOrder = ["Academic", "Romance", "Fantasy", "Sci-Fi", "Comics", "Action"];
    const sortedKeys = Object.keys(categories).sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    sortedKeys.forEach(catName => {
        const categoryBooks = categories[catName];
        const section = document.createElement("div");
        section.className = "category";
        section.innerHTML = `<h3>${catName}</h3>`;

        const grid = document.createElement("div");
        grid.className = "books";

        const cardsHTML = categoryBooks.map(book => {
            const stars = generateStars(book.rating || 4);
            return `
                <div class="book">
                    <img src="${book.img_url || 'ASSETS/default.jpg'}" alt="${book.title}" loading="lazy">
                    <p><strong>${book.title}</strong></p>
                    <small>By ${book.author || 'Unknown'}</small>
                    <div class="stars">${stars}</div>
                    <button class="save-btn" 
                        data-title="${book.title}" 
                        data-author="${book.author}" 
                        data-img="${book.img_url}">💾 Save</button>
                    <button class="read-btn" data-title="${book.title}">📖 Read</button>
                </div>
            `;
        }).join('');

        grid.innerHTML = cardsHTML;
        section.appendChild(grid);
        container.appendChild(section);
    });
    setupTiltEffect();
}

function generateStars(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) starsHTML += '<i class="fas fa-star" style="color: gold;"></i>';
        else if (i - 0.5 === rating) starsHTML += '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
        else starsHTML += '<i class="far fa-star" style="color: #ccc;"></i>';
    }
    return starsHTML;
}

function setupTiltEffect() {
    const cards = document.querySelectorAll('.book');
    if(cards.length === 0) return;
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRot = -((y - rect.height/2)/20);
            const yRot = ((x - rect.width/2)/20);
            card.style.transform = `perspective(1000px) scale(1.05) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
            card.style.zIndex = "10";
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            card.style.zIndex = "1";
            card.style.transition = 'transform 0.5s ease';
        });
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none'; 
        });
    });
}

function setupScrollEffects() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("appear");
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".category").forEach(el => observer.observe(el));
}

function initializeCarousel() {
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    if (!track || !prevBtn || !nextBtn) return;
    let currentPosition = 0;
    function getItemsPerView() {
        const w = window.innerWidth;
        if (w <= 480) return 1; if (w <= 768) return 2; if (w <= 1024) return 3; return 4;
    }
    function getItemWidth() {
        if (track.children.length === 0) return 0;
        return track.children[0].offsetWidth + 24; 
    }
    function updateCarousel() {
        const itemWidth = getItemWidth();
        if(itemWidth === 0) return;
        const maxPos = (track.scrollWidth - track.offsetWidth);
        
        currentPosition = Math.max(0, Math.min(currentPosition, maxPos));
        track.style.transform = `translateX(-${currentPosition}px)`;
        
        prevBtn.disabled = currentPosition <= 10; 
        nextBtn.disabled = currentPosition >= maxPos - 10; 
    }
    
    // Scroll by one item at a time
    nextBtn.addEventListener('click', () => { 
        currentPosition += getItemWidth(); 
        updateCarousel(); 
    });
    prevBtn.addEventListener('click', () => { 
        currentPosition -= getItemWidth(); 
        updateCarousel(); 
    });
    
    window.addEventListener('resize', () => setTimeout(updateCarousel, 200));
    setTimeout(updateCarousel, 500); 
}

function setupEventDelegation() {
    document.addEventListener("click", (e) => {
        const target = e.target;
        // READ Button
        if (target.classList.contains("read-btn")) {
            const title = target.getAttribute("data-title");
            const book = globalBooks.find(b => b.title === title) || { title: title, author: "Unknown" };
            openReader(book);
        }
        // SAVE Button
        if (target.classList.contains("save-btn")) {
            const card = target.closest('.book');
            const title = target.getAttribute("data-title");
            const author = target.getAttribute("data-author");
            const img = card.querySelector('img')?.src || 'ASSETS/default.jpg';
            let saved = JSON.parse(localStorage.getItem("savedBooks")) || [];
            if (!saved.some(b => b.title === title)) {
                saved.push({ 
                    title, 
                    author, 
                    img, 
                    status: 'unread', 
                    pagesRead: 0,
                    totalPages: 300 
                });
                localStorage.setItem("savedBooks", JSON.stringify(saved));
                alert(`✅ Saved "${title}" to Library!`);
            } else {
                alert(`📚 "${title}" is already saved.`);
            }
        }
        // MODAL Close Button
        if (target.id === "closeLogin" || target === document.getElementById("loginModal")) {
            document.getElementById("loginModal")?.classList.remove("show");
        }

        // ===========================================
        // 🚀 NEW: REGISTER BUTTON FUNCTIONALITY
        // ===========================================
        // This handles any click on an element with class 'event-register-btn' or its children
        const registerBtn = target.closest(".event-register-btn");
        
        if (registerBtn) {
            e.preventDefault(); // Prevent default if any

            // Optional: Check if user is logged in first
            // Note: Since 'auth' is imported, we can check auth.currentUser
            if (!auth.currentUser) {
                alert("Please log in to register for events!");
                showLoginModal();
                return;
            }

            // 1. Get Event Title from the closest card
            const card = registerBtn.closest(".event-card");
            // Find h3 inside the card (contains the title)
            const eventTitle = card ? card.querySelector("h3")?.innerText : "this event";

            // 2. Visual Success Feedback
            // Change color to green
            registerBtn.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)";
            // Change text
            registerBtn.innerHTML = `<i class="fas fa-check-circle"></i> Registered`;
            // Disable button
            registerBtn.style.cursor = "default";
            registerBtn.style.transform = "none";
            registerBtn.disabled = true;

            // 3. Alert the user
            // In a real app, you would save this to Supabase/Firebase here
            setTimeout(() => {
                alert(`🎉 Success! You have registered for: \n"${eventTitle}"\n\nWe have sent a confirmation to your email.`);
            }, 100);
        }
    });
}

function openReader(book) {
    const modal = document.getElementById("storyModal");
    const titleEl = document.getElementById("readerTitle");
    const chapterList = document.getElementById("chapterList");
    const chapterTitleDisplay = document.getElementById("chapterTitleDisplay");
    const storyText = document.getElementById("storyText");
    const closeBtn = document.getElementById("closeModal");
    const prevBtn = document.getElementById("prevChapter");
    const nextBtn = document.getElementById("nextChapter");

    if (!modal) return;
    if(titleEl) titleEl.textContent = book.title;

    let chapters = [];
    if (book.chapters && Array.isArray(book.chapters) && book.chapters.length > 0) {
        chapters = book.chapters;
    } else {
        chapters = [{ title: "No Content", content: "We are currently digitizing this book." }];
    }
    let currentChapterIndex = 0;

    function renderChapter(index) {
        currentChapterIndex = index;
        const chapter = chapters[index];
        if(chapterTitleDisplay) chapterTitleDisplay.textContent = chapter.title;
        if(storyText) {
            const paragraphs = chapter.content.split('\n').filter(p => p.trim() !== '');
            const htmlContent = paragraphs.map(p => `<p style="margin-bottom: 1.5em;">${p}</p>`).join('');
            storyText.innerHTML = htmlContent;
            storyText.scrollTop = 0;
        }
        if(chapterList) {
            const listItems = chapterList.querySelectorAll('.chapter-item');
            listItems.forEach((li, idx) => {
                if (idx === index) li.classList.add('active'); else li.classList.remove('active');
            });
        }
        if(prevBtn) prevBtn.disabled = index === 0;
        if(nextBtn) nextBtn.disabled = index === chapters.length - 1;
    }

    if(chapterList) {
        chapterList.innerHTML = "";
        chapters.forEach((chap, index) => {
            const li = document.createElement("li");
            li.className = "chapter-item";
            li.textContent = chap.title;
            li.onclick = () => renderChapter(index);
            chapterList.appendChild(li);
        });
    }

    // Re-bind navigation listeners to avoid duplicates
    if(prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.onclick = () => { if (currentChapterIndex > 0) renderChapter(currentChapterIndex - 1); };
    }
    if(nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.onclick = () => { if (currentChapterIndex < chapters.length - 1) renderChapter(currentChapterIndex + 1); };
    }

    renderChapter(0);
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove("show");
            document.body.style.overflow = "";
        };
    }
}

// ================= UI HELPERS =================
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mobileNav');
    if (toggle && nav) {
        toggle.addEventListener('click', (e) => { e.stopPropagation(); nav.classList.toggle('active'); });
        document.addEventListener('click', (e) => { if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('active'); });
    }
}

/* ============================
   CLEAN + UNIFIED SEARCH SYSTEM
   ============================ */

function setupSearchBar() {
    const toggle = document.getElementById("searchToggle");
    const container = document.querySelector(".search-container");
    const input = document.getElementById("headerSearchInput");
    const form = document.getElementById("headerSearchForm");

    if (!toggle || !container) return;

    toggle.addEventListener("click", () => {
        container.classList.toggle("active");
        if (container.classList.contains("active")) {
            setTimeout(() => input.focus(), 150);
        } else {
            input.value = "";
            searchBooks("");
        }
    });

    input.addEventListener("keyup", () => {
        searchBooks(input.value);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        searchBooks(input.value);
    });
}


/* ============================
   UNIVERSAL FILTER FUNCTION
   ============================ */

function searchBooks(keyword) {
    keyword = keyword.toLowerCase();

    const allBooks = document.querySelectorAll(
        ".carousel-item, .book, .books .book"
    );

    allBooks.forEach(book => {
        let title =
            book.querySelector("h3")?.textContent ||
            book.querySelector("p strong")?.textContent ||
            book.querySelector("p")?.textContent;

        if (!title) return;

        title = title.toLowerCase();

        if (title.includes(keyword)) {
            book.style.display = "";
        } else {
            book.style.display = "none";
        }
    });
}

/* ================= DARK MODE FIX ================= */

function setupToggles() {
    const modeToggle = document.getElementById("modeToggle");

    // Load saved theme
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.body.classList.add("dark");

    if (modeToggle) {
        modeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");

            const isDark = document.body.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");

            // change icon
            modeToggle.innerHTML = isDark
                ? `<i class="fas fa-sun"></i>`
                : `<i class="fas fa-moon"></i>`;
        });
    }
}


export { openReader, globalBooks };