import { registerUser, loginUser, logoutUser, auth, loginWithGoogle, loginWithFacebook } from "./firebase.js";
import { getBooksFromSupabase } from "./Supabaseclient.js";

// ================= GLOBAL VARIABLES =================
let globalBooks = []; 

// ================= MAIN INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 System Initializing...");

    // 1. Render Books (With Layout Fix)
    renderBooks();

    // 2. Initialize UI Components
    initializeCarousel();
    setupMobileMenu();
    setupSearchBar();
    setupScrollEffects();
    
    // 3. Auth Listener
    if (auth) auth.onAuthStateChanged(updateAuthUI);

    // 4. Global Event Listeners (Read, Save, etc.)
    setupEventDelegation();
});

// ================= 1. SMART BOOK RENDERING (LAYOUT FIX) =================
async function renderBooks() {
    console.log("⏳ Fetching books...");
    
    const books = await getBooksFromSupabase(); 
    
    const container = document.getElementById("dynamicCategoriesContainer");
    if (!container) return;

    // Fallback if no books found
    if (!books || books.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #e74c3c;"></i>
                <p>No books found in the library database.</p>
            </div>`;
        return;
    }

    // Save to global variable for Reader
    globalBooks = books; 
    
    // Clear Loading Spinner
    container.innerHTML = "<h2>📖 Explore by Categories</h2>"; 

    // --- STEP A: GROUP BOOKS BY CATEGORY ---
    const categories = {};
    books.forEach(book => {
        // Use 'Others' if category is missing
        const catName = book.category || "Others";
        if (!categories[catName]) {
            categories[catName] = [];
        }
        categories[catName].push(book);
    });

    // --- STEP B: RENDER EACH CATEGORY SECTION ---
    // Order of categories (Optional: prioritize specific ones)
    const preferredOrder = ["Academic", "Romance", "Fantasy", "Sci-Fi", "Comics", "Action"];
    
    // Sort keys based on preference, then others
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
        
        // Create Section Wrapper
        const section = document.createElement("div");
        section.className = "category"; // Matches CSS style
        section.innerHTML = `<h3>${catName}</h3>`;

        // Create Grid Container
        const grid = document.createElement("div");
        grid.className = "books"; // Matches CSS grid layout

        // Create Cards
        const cardsHTML = categoryBooks.map(book => {
            const stars = generateStars(book.rating || 4); // Default to 4 if null
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

    // --- STEP C: RE-INITIALIZE ANIMATIONS ---
    // Important: We call this AFTER elements are added to DOM
    setupTiltEffect();
}

// Helper: Generate Star HTML
function generateStars(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<i class="fas fa-star" style="color: gold;"></i>';
        } else if (i - 0.5 === rating) {
            starsHTML += '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
        } else {
            starsHTML += '<i class="far fa-star" style="color: #ccc;"></i>';
        }
    }
    return starsHTML;
}

// ================= 2. ANIMATIONS & EFFECTS =================
function setupTiltEffect() {
    const cards = document.querySelectorAll('.book');
    
    if(cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation
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
            card.style.transition = 'none'; // Snappy movement
        });
    });
}

function setupScrollEffects() {
    // Fade In Elements on Scroll
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("appear");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".category").forEach(el => observer.observe(el));
}

// ================= 3. CAROUSEL LOGIC =================
function initializeCarousel() {
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    
    if (!track || !prevBtn || !nextBtn) return;

    let currentPosition = 0;
    
    function getItemsPerView() {
        const w = window.innerWidth;
        if (w <= 480) return 1;
        if (w <= 768) return 2;
        if (w <= 1024) return 3;
        return 4;
    }
    
    function getItemWidth() {
        if (track.children.length === 0) return 0;
        return track.children[0].offsetWidth + 20; // Width + Gap
    }
    
    function updateCarousel() {
        const itemWidth = getItemWidth();
        const maxPos = (track.children.length - getItemsPerView()) * itemWidth;
        currentPosition = Math.max(0, Math.min(currentPosition, maxPos));
        track.style.transform = `translateX(-${currentPosition}px)`;
        
        prevBtn.disabled = currentPosition <= 0;
        nextBtn.disabled = currentPosition >= maxPos;
    }
    
    nextBtn.addEventListener('click', () => {
        currentPosition += getItemWidth() * getItemsPerView();
        updateCarousel();
    });
    
    prevBtn.addEventListener('click', () => {
        currentPosition -= getItemWidth() * getItemsPerView();
        updateCarousel();
    });
    
    window.addEventListener('resize', () => setTimeout(updateCarousel, 200));
    setTimeout(updateCarousel, 500); // Initial calc
}

// ================= 4. AUTHENTICATION UI =================
function updateAuthUI(user) {
    const accountToggle = document.getElementById("accountToggle");
    const loginModal = document.getElementById("loginModal");
    const userInfo = document.querySelector(".user-info span");
    
    if (!accountToggle || !loginModal) return; 

    if (user) {
        // LOGGED IN
        accountToggle.innerHTML = "👋"; 
        if(userInfo) userInfo.textContent = user.displayName || user.email.split('@')[0];
        
        accountToggle.onclick = async () => {
            if(confirm("Log out now?")) await logoutUser();
        };

        const dropdownLogout = document.querySelector(".logout-btn");
        if(dropdownLogout) dropdownLogout.onclick = async () => await logoutUser();

        loginModal.classList.remove("show"); 
        document.body.style.overflow = ""; 

    } else {
        // LOGGED OUT
        accountToggle.innerHTML = '<i class="fas fa-user"></i>';
        if(userInfo) userInfo.textContent = "Guest User";

        accountToggle.onclick = () => {
            loginModal.classList.add("show");
            document.body.style.overflow = "hidden";
        };
    }
}

// ================= 5. GLOBAL EVENT HANDLER (Clean & Efficient) =================
function setupEventDelegation() {
    document.addEventListener("click", (e) => {
        const target = e.target;

        // --- READ BUTTON ---
        if (target.classList.contains("read-btn")) {
            const title = target.getAttribute("data-title");
            const book = globalBooks.find(b => b.title === title) || { title: title, author: "Unknown" };
            openReader(book);
        }

        // --- SAVE BUTTON ---
        if (target.classList.contains("save-btn")) {
            const title = target.getAttribute("data-title");
            const author = target.getAttribute("data-author");
            const img = target.getAttribute("data-img");

            let saved = JSON.parse(localStorage.getItem("savedBooks")) || [];
            if (!saved.some(b => b.title === title)) {
                saved.push({ title, author, img, read: false });
                localStorage.setItem("savedBooks", JSON.stringify(saved));
                alert(`✅ Saved "${title}" to Library!`);
            } else {
                alert(`📚 "${title}" is already saved.`);
            }
        }

        // --- CLOSE MODALS ---
        if (target.id === "closeLogin" || target === document.getElementById("loginModal")) {
            document.getElementById("loginModal").classList.remove("show");
            document.body.style.overflow = "";
        }
    });

    // --- LOGIN FORM ---
    const authForm = document.getElementById("authForm");
    if(authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("authEmail").value;
            const pass = document.getElementById("authPassword").value;
            await loginUser(email, pass);
        });
    }

    // --- SOCIAL LOGIN ---
    document.querySelector(".google-btn")?.addEventListener("click", loginWithGoogle);
    document.querySelector(".facebook-btn")?.addEventListener("click", loginWithFacebook);
}

// ================= 6. READER MODAL =================
function openReader(book) {
    const modal = document.getElementById("storyModal");
    const titleEl = document.getElementById("readerTitle") || document.getElementById("storyTitle");
    const chapterList = document.getElementById("chapterList");
    const storyText = document.getElementById("storyText");
    const closeBtn = document.getElementById("closeModal");

    if (!modal) return;

    // Set Title
    if (titleEl) titleEl.textContent = book.title;

    // Reset
    if (chapterList) chapterList.innerHTML = "";
    if (storyText) storyText.innerHTML = "<p>Select a chapter to start reading.</p>";

    // Check Chapters
    if (book.chapters && Array.isArray(book.chapters) && book.chapters.length > 0) {
        // Build Sidebar
        book.chapters.forEach((chap) => {
            const li = document.createElement("li");
            li.className = "chapter-item";
            li.textContent = chap.title;
            li.onclick = () => {
                storyText.innerHTML = `<h3>${chap.title}</h3><div style="white-space: pre-wrap;">${chap.content}</div>`;
                document.querySelectorAll('.chapter-item').forEach(i => i.classList.remove('active'));
                li.classList.add('active');
            };
            chapterList.appendChild(li);
        });

        // Load First Chapter automatically
        chapterList.children[0].click();

    } else {
        if(storyText) storyText.innerHTML = `
            <div style="padding:30px; text-align:center;">
                <h3>Coming Soon</h3>
                <p>The content for <strong>${book.title}</strong> is being digitized.</p>
            </div>`;
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove("show");
            document.body.style.overflow = "";
        };
    }
}

// ================= 7. UI HELPERS =================
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mobileNav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('active');
        });
    }
}

function setupSearchBar() {
    const toggle = document.getElementById("searchToggle");
    const bar = document.querySelector("header .search-bar");
    if (toggle && bar) {
        toggle.addEventListener("click", () => {
            bar.classList.toggle("show");
            if(bar.classList.contains("show")) document.getElementById("headerSearchInput")?.focus();
        });
    }
}