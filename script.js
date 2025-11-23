// ========== FIREBASE IMPORTS (MUST BE AT TOP) ==========
import { 
    getBooksFromDB, 
    registerUser, 
    loginUser, 
    logoutUser, 
    auth 
} from "./firebase.js";


// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});
// ========== MOBILE MENU TOGGLE ==========
document.addEventListener("DOMContentLoaded", () => {
    // ... your existing code ...
    
    // Mobile menu functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileModeToggle = document.querySelector('.mobile-mode-toggle');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close mobile menu when clicking on links
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    if (mobileModeToggle) {
        mobileModeToggle.addEventListener('click', () => {
            body.classList.toggle("dark");
            const isDark = body.classList.contains("dark");
            darkModeToggle.innerHTML = isDark ? "☀️" : "🌙";
            mobileModeToggle.querySelector('i').className = isDark ? "fas fa-sun" : "fas fa-moon";
            mobileModeToggle.querySelector('span').textContent = isDark ? "Light Mode" : "Dark Mode";
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }
    
    // Update dark mode icon in header
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            body.classList.toggle("dark");
            const isDark = body.classList.contains("dark");
            darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }
});

// ========== SCROLL FADE EFFECT ==========
const fadeElements = document.querySelectorAll(".fade-in");
const appearOnScroll = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("appear");
      appearOnScroll.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

fadeElements.forEach(el => appearOnScroll.observe(el));


// ========== SAVE TO LIBRARY ========== 
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("save-btn")) {
    const button = e.target;
    
    
    let title = button.getAttribute("data-title");
    let author = button.getAttribute("data-author");
    let img = button.getAttribute("data-img");

    
    if (!title) {
        // Fallback for hardcoded books without data-attributes
        const bookElement = button.closest(".book, .book-card, .latest-books > .book");
        if (bookElement) {
             // Search for title/image in the hardcoded structure
             title = bookElement.querySelector("strong, h3")?.textContent.trim() || "Untitled Book";
             img = bookElement.querySelector("img")?.src || "";
             author = "Unknown Author"; 
        }
    }
    
    if (!title) {
        console.error("Could not find book title for saving.");
        alert("Error saving book: Title not found.");
        return;
    }

    let savedBooks = JSON.parse(localStorage.getItem("savedBooks")) || [];

    if (savedBooks.some(book => book.title === title)) {
      alert(`📚 "${title}" is already in your library!`);
      return;
    }

    savedBooks.push({ title, author, img });
    localStorage.setItem("savedBooks", JSON.stringify(savedBooks));

    alert(`✅ "${title}" has been saved to your library!`);
  }
});


function updateAuthUI(user) {
    const accountToggle = document.getElementById("accountToggle");
    const loginModal = document.getElementById("loginModal");
    
    if (!accountToggle || !loginModal) return; 

    if (user) {
      // User is logged in: Set icon to LOGOUT
      accountToggle.innerHTML = "👋";
      accountToggle.onclick = async () => {
        await logoutUser();
        updateAuthUI(null);
      };
      loginModal.classList.remove("show"); 
      document.body.style.overflow = ""; // Enable scrolling/access

    } else {
  
      accountToggle.innerHTML = "👤";
      accountToggle.onclick = () => {
        loginModal.classList.add("show");
        document.body.style.overflow = "hidden";
      };

     
      loginModal.classList.add("show");
      document.body.style.overflow = "hidden"; // Disable scrolling on the main page
    }
}

document.addEventListener("DOMContentLoaded", () => {
    
    if (auth) {
        auth.onAuthStateChanged(updateAuthUI); 
    }

    const loginModal = document.getElementById("loginModal");
    const closeLogin = document.getElementById("closeLogin");
    const authForm = document.getElementById("authForm");
    const registerButton = document.getElementById("registerButton");
    const authEmail = document.getElementById("authEmail");
    const authPassword = document.getElementById("authPassword");

    
   
    if (closeLogin) {
        closeLogin.addEventListener("click", (e) => {
            e.preventDefault(); // I-block ang default action
            alert("You must log in or register to close this window and access the library.");
        });
    }

   
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) {
                e.preventDefault(); // I-block ang default action
                alert("You must log in or register to close this window and access the library.");
            }
        });
    }


    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = authEmail.value;
            const password = authPassword.value;
            
            try {
               
                await loginUser(email, password);
                authEmail.value = "";
                authPassword.value = "";
            } catch (error) {
                // Error handled in firebase.js
            }
        });
    }
    
    // 3. REGISTER EVENT LISTENER (TAMA NA)
    if (registerButton) {
        registerButton.addEventListener("click", async () => {
            const email = authEmail.value;
            const password = authPassword.value;
            
            if (!email || !password) {
                alert("Please enter both email and password for registration.");
                return;
            }
            
            try {
                await registerUser(email, password);
                authEmail.value = "";
                authPassword.value = "";
            } catch (error) {
                // Error handled in firebase.js
            }
        });
    }

    // ========== SEARCH BAR TOGGLE & LOGIC (Updated) ==========
    const searchToggle = document.getElementById("searchToggle");
    const searchBar = document.querySelector("header .search-bar"); 
    const searchInput = searchBar?.querySelector("input");
    const searchButton = searchBar?.querySelector("button");

    if (searchToggle && searchBar && searchInput && searchButton) {
      
      // 1. Search Toggle Functionality
      searchToggle.addEventListener("click", () => {
        searchBar.classList.toggle("show");
        if (searchBar.classList.contains("show")) {
          searchInput.focus();
        }
      });
      
      // 2. Search Execution Logic
      const executeSearch = (e) => {
          e.preventDefault();
          const query = searchInput.value;
          if (query.length > 1) {
            
              const targetSection = document.getElementById("searchResultsSection");
              if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });
              
              filterAndRenderBooks(query);
          } else {
              alert("Please enter at least 2 characters to search.");
          }
      };

      searchButton.addEventListener("click", executeSearch);
      
      searchInput.addEventListener("keypress", (e) => {
          if (e.key === 'Enter') {
              executeSearch(e);
          }
      });
      
    }
  // ========== SIMPLIFIED CAROUSEL FUNCTION ==========
function initializeCarousel() {
    console.log("Initializing carousel...");
    
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    
    if (!track) {
        console.error("Carousel track not found!");
        return;
    }
    
    if (!prevBtn || !nextBtn) {
        console.error("Carousel buttons not found!");
        return;
    }

    console.log("Carousel elements found:", { track, prevBtn, nextBtn });

    let currentPosition = 0;
    let itemsPerView = 4; // Default for desktop
    
    // Function to calculate how many items to show based on screen size
    function getItemsPerView() {
        const width = window.innerWidth;
        if (width <= 480) return 1;
        if (width <= 768) return 2;
        if (width <= 1024) return 3;
        return 4;
    }
    
    // Function to get the width of one item including gap
    function getItemWidth() {
        if (track.children.length === 0) return 0;
        
        const firstItem = track.children[0];
        const itemStyle = window.getComputedStyle(firstItem);
        const itemWidth = firstItem.offsetWidth;
        const gap = parseInt(window.getComputedStyle(track).gap) || 20;
        
        console.log("Item width calculation:", { itemWidth, gap });
        return itemWidth + gap;
    }
    
    // Function to update carousel position
    function updateCarousel() {
        itemsPerView = getItemsPerView();
        const itemWidth = getItemWidth();
        const maxPosition = (track.children.length - itemsPerView) * itemWidth;
        
        // Ensure currentPosition doesn't go beyond limits
        currentPosition = Math.max(0, Math.min(currentPosition, maxPosition));
        
        console.log("Moving carousel to:", currentPosition, "Max:", maxPosition);
        
        track.style.transform = `translateX(-${currentPosition}px)`;
        
        // Update button states
        prevBtn.disabled = currentPosition === 0;
        nextBtn.disabled = currentPosition >= maxPosition;
        
        console.log("Button states:", {
            prevDisabled: prevBtn.disabled,
            nextDisabled: nextBtn.disabled
        });
    }
    
    // Next button click handler
    function nextSlide() {
        console.log("Next button clicked");
        const itemWidth = getItemWidth();
        const maxPosition = (track.children.length - getItemsPerView()) * itemWidth;
        
        if (currentPosition < maxPosition) {
            currentPosition += itemWidth * itemsPerView;
            // If we're close to the end, snap to the exact end
            if (currentPosition > maxPosition) {
                currentPosition = maxPosition;
            }
            updateCarousel();
        }
    }
    
    // Previous button click handler
    function prevSlide() {
        console.log("Previous button clicked");
        const itemWidth = getItemWidth();
        
        if (currentPosition > 0) {
            currentPosition -= itemWidth * itemsPerView;
            // Ensure we don't go below 0
            if (currentPosition < 0) {
                currentPosition = 0;
            }
            updateCarousel();
        }
    }
    
    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized, updating carousel...");
            updateCarousel();
        }, 250);
    });
    
    // Initialize carousel after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log("Initial carousel setup");
        updateCarousel();
    }, 100);
    
    // Recalculate on images load (in case images affect layout)
    const images = track.querySelectorAll('img');
    let imagesLoaded = 0;
    
    images.forEach(img => {
        if (img.complete) {
            imagesLoaded++;
        } else {
            img.addEventListener('load', () => {
                imagesLoaded++;
                if (imagesLoaded === images.length) {
                    console.log("All images loaded, updating carousel");
                    updateCarousel();
                }
            });
        }
    });
    
    // If all images are already loaded
    if (imagesLoaded === images.length && images.length > 0) {
        setTimeout(updateCarousel, 100);
    }
    
    return {
        nextSlide,
        prevSlide,
        updateCarousel
    };
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing carousel...");
    const carousel = initializeCarousel();
    
    // Make carousel globally available for debugging
    window.carousel = carousel;
});

// Also initialize if script loads after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarousel);
} else {
    initializeCarousel();
}
    
    // ========== STORY MODAL LOGIC (INILIPAT MULA SA index.html) ==========
    const stories = {
        "English Academic": "English Academic focuses on building students’ skills in reading, writing, and critical thinking...",
        "Philippine History": "Philippine History explores the country’s journey from pre-colonial times to the present day...",
        "Noli Me Tangere": "Noli Me Tangere is a novel written by Dr. José Rizal that exposed the injustices and corruption under Spanish rule...",
        "Splinters": "Splinters tells the story of two people shattered by their pasts, both struggling to piece their lives back together...",
        "Night Shade": "Night Shade is a tale of forbidden love wrapped in mystery and danger...",
        "Romance Rivalry": "Romance Rivalry follows two best friends who find themselves in love with the same person...",
        "Queen of Carrion": "Queen of Carrion is a dark fantasy about a fallen princess who rises from the ruins of her kingdom...",
        "The Lottery": "The Lottery by Shirley Jackson is a chilling story about tradition, conformity, and human cruelty...",
        "SwordHeart": "SwordHeart follows a reluctant hero who inherits a cursed sword bound to a warrior’s spirit...",
        "Tear my World": "Tear My World is a science fiction story set in a future where humanity’s obsession with technology has torn the planet apart...",
        "True Beauty": "True Beauty tells the story of a young woman who struggles with her self-image in a world obsessed with perfection...",
        "My Fair Position": "My Fair Position blends romance and fantasy in a world where power and status define destiny...",
        "Underworld": "Underworld follows a fallen warrior trapped in a realm between life and death...",
        "Doom Breaker": "Doom Breaker tells the story of a warrior cursed by the gods and doomed to repeat his tragic fate...",
        "His Into Her": "His Into Her is a high school romance filled with humor, rivalry, and heartfelt moments...",
        "Echoes of Tomorrow": "Echoes of Tomorrow is a sci-fi story about time, memory, and the choices that define us...",
        "Silent Fate": "Silent Fate tells the story of a novelist whose written words begin to alter reality..."
    };

    const modal = document.getElementById("storyModal");
    const storyTitle = document.getElementById("storyTitle");
    const storyText = document.getElementById("storyText");
    const closeModal = document.getElementById("closeModal");

    function extractTitleFromCard(card) {
      if (!card) return null;
      // Mas marami pang selectors para masigurado na makuha ang title
      const selectors = ["h3", "h4", "h2", "strong", "p > strong", ".title"];
      for (const sel of selectors) {
        const el = card.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim();
      }
      const fallback = card.querySelector(".book-info h3");
      if (fallback) return fallback.textContent.trim();
      return null;
    }

    // Attach read button listener globally (since dynamic content needs it)
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("read-btn")) {
            const btn = e.target;
            const card = btn.closest(".book, .book-card, .latest-books > .book") || btn.parentElement;
            const title = btn.getAttribute("data-title") || extractTitleFromCard(card) || "Untitled Book"; 
            const content = stories[title] || "Sorry — this story is not yet available. Add it to the 'stories' object in the script.";
            
            storyTitle.textContent = title;
            storyText.textContent = content;
            modal.classList.add("show");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }
    });

    function closeStory() {
      if (modal) {
          modal.classList.remove("show");
          modal.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
      }
    }

    if (closeModal) closeModal.addEventListener("click", closeStory);
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeStory(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStory(); });
    
    const subscribeForms = document.querySelectorAll(".subscribe-form");
    const subscribeForm = subscribeForms[subscribeForms.length - 1]; // Kunin ang form sa info-section
    const emailInput = subscribeForm ? subscribeForm.querySelector("input[type='email']") : null;

    if (subscribeForm && emailInput) {
        subscribeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = emailInput.value;

            try {
              
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("✅ Subscription Successful: " + data.message);
                    emailInput.value = ''; // Clear input
                } else {
                    alert("❌ Subscription Failed: " + data.error);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("An error occurred during subscription.");
            }
        });
    }

}); 

// script.js (Rendering Books)
async function renderBooks() {
    // 1. Fetch data from Firestore
    const books = await getBooksFromDB(); 
    const container = document.getElementById("dynamicCategoriesContainer");

    if (!container) return;
    
    
    
    const dynamicBooksWrapper = document.createElement('div');
    dynamicBooksWrapper.id = 'dynamicBooksWrapper';
    dynamicBooksWrapper.innerHTML = '<h3>✨ Dynamic Books from Firestore (Test)</h3><div class="books"></div>';
    
    const booksHTML = books.map(book => `
        <div class="book">
            <img src="${book.img_url || 'ASSETS/default.jpg'}" alt="${book.title}">
            <p><strong>${book.title}</strong></p>
            <small>By ${book.author || 'N/A'}</small>
            <button class="save-btn" data-title="${book.title}" data-author="${book.author}">💾 Save</button>
            <button class="read-btn" data-title="${book.title}">📖 Read</button>
        </div>
    `).join('');

    dynamicBooksWrapper.querySelector('.books').innerHTML = booksHTML;

    // 4. Append the generated HTML to the container
    if (books.length > 0) {
        container.appendChild(dynamicBooksWrapper);
    }
}

// 5. Call the function on page load 
document.addEventListener("DOMContentLoaded", renderBooks);