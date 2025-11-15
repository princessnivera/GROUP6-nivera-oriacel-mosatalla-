// ========== FIREBASE IMPORTS (MUST BE AT TOP) ==========
// 1. IMPORT ALL NECESSARY FIREBASE FUNCTIONS
import { 
    getBooksFromDB, 
    registerUser, 
    loginUser, 
    logoutUser, 
    auth 
} from "./firebase.js";

// Ensure elements exist before trying to access them
const body = document.body;
const darkModeToggle = document.getElementById("modeToggle");


// ========== DARK MODE ==========  
if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark");
        const isDark = body.classList.contains("dark");
        darkModeToggle.innerHTML = isDark ? "☀️" : "🌙";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}


// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
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



// ========== SAVE TO LIBRARY (Kept and slightly modified for dynamic and static buttons) ==========
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("save-btn")) {
    const button = e.target;
    
    // Try to get data from attributes first (for dynamically rendered books)
    let title = button.getAttribute("data-title");
    let author = button.getAttribute("data-author");
    let img = button.getAttribute("data-img");

    // Fallback to searching DOM (for hardcoded books)
    if (!title) {
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


// ========== LOGIN/REGISTER FUNCTIONALITY (Access Gate Enforced) ==========

/**
 * Helper function to update the account icon and enforce the access gate.
 * The modal will automatically appear and block access if the user is logged out.
 */
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
      // User is logged out: BLOCK access, SHOW modal automatically
      accountToggle.innerHTML = "👤";
      accountToggle.onclick = () => {
        loginModal.classList.add("show");
        document.body.style.overflow = "hidden";
      };

      // 🚨 ACCESS GATE: AUTOMATICALLY SHOW MODAL ON PAGE LOAD/STATE CHANGE
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

    
    // 🛑 ACCESS GATE FIX: Prevent closing the modal via the 'X' button
    if (closeLogin) {
        closeLogin.addEventListener("click", (e) => {
            e.preventDefault(); // I-block ang default action
            alert("You must log in or register to close this window and access the library.");
        });
    }

    // 🛑 ACCESS GATE FIX: Prevent closing the modal by clicking outside
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) {
                e.preventDefault(); // I-block ang default action
                alert("You must log in or register to close this window and access the library.");
            }
        });
    }


    // 2. LOGIN EVENT LISTENER (TAMA NA ANG PAGPASA NG AUTH)
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = authEmail.value;
            const password = authPassword.value;
            
            try {
                // TAMA: Ang auth object ay ipinapasa na.
                await loginUser(auth, email, password); 
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

    // ========== SEARCH BAR TOGGLE (Simplified) ==========
    const searchToggle = document.getElementById("searchToggle");
    const searchBar = document.querySelector(".search-bar");

    if (searchToggle && searchBar) {
      searchToggle.addEventListener("click", () => {
        searchBar.classList.toggle("show");
        if (searchBar.classList.contains("show")) {
          searchBar.querySelector("input").focus();
        }
      });
    }
});