
document.addEventListener("DOMContentLoaded", () => {
  // ========== NIGHT/DAY MODE ==========
  const body = document.body;
  const darkModeToggle = document.getElementById("modeToggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    body.classList.add("dark");
    darkModeToggle.textContent = "☀️";
  }

  darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");
    darkModeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // ========== SEARCH ICON ==========
  const searchToggle = document.getElementById("searchToggle");
  const searchBar = document.querySelector(".search-bar");
  if (searchToggle && searchBar) {
    searchToggle.addEventListener("click", () => {
      const isVisible = searchBar.style.display === "flex" || searchBar.style.display === "block";
      searchBar.style.display = isVisible ? "none" : "flex";
    });
  }

  // ========== ACCOUNT ICON ==========
  const accountIcon = document.querySelector(".icons span:nth-child(2)");
  if (accountIcon) {
    accountIcon.style.cursor = "pointer";
    accountIcon.addEventListener("click", () => {
      const confirmLogin = confirm("Do you want to sign in or create an account?");
      if (confirmLogin) {
        window.location.href = "login.html";
      }
    });
  }
});



// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});


// ========== SCROLL FADE ANIMATION ==========
const fadeElements = document.querySelectorAll(".fade-in");
const appearOnScroll = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("appear");
      appearOnScroll.unobserve(entry.target);
    }
  });
}, { threshold: 0.2, rootMargin: "0px 0px -50px 0px" });

fadeElements.forEach(el => appearOnScroll.observe(el));


// ========== SEARCH BAR HINT ==========
const searchInput = document.querySelector(".search-bar input");
if (searchInput) {
  const hints = ["Search books...", "Find authors...", "Explore events...", "Discover features..."];
  let index = 0;
  setInterval(() => {
    searchInput.setAttribute("placeholder", hints[index]);
    index = (index + 1) % hints.length;
  }, 2500);
}


// ========== CAROUSEL ==========
const track = document.querySelector("#carouselTrack");
if (track) {
  const items = Array.from(track.children);
  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  let currentIndex = 0;
  const visibleItems = 4; 
  const itemWidth = items[0].getBoundingClientRect().width + 20; // spacing

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
  }

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % (items.length - visibleItems + 1);
    updateCarousel();
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + items.length - visibleItems + 1) % (items.length - visibleItems + 1);
    updateCarousel();
  });

  // Auto slide
  setInterval(() => nextBtn.click(), 4000);
}


// ========== HEADER SCROLL EFFECT ==========
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  header.style.boxShadow = window.scrollY > 60 ? "0 4px 15px rgba(0,0,0,0.2)" : "none";
});


// ========== SEARCH FUNCTION ==========
const searchForm = document.querySelector(".search-bar");
if (searchForm) {
  searchForm.addEventListener("submit", e => {
    e.preventDefault();
    const query = searchForm.querySelector("input").value.toLowerCase().trim();
    if (!query) return;

    const allItems = document.querySelectorAll(".author-card, .carousel-item, .book-card");
    let found = false;
    allItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? "block" : "none";
      if (text.includes(query)) found = true;
    });

    if (!found) alert(`No results found for "${query}" 😢`);
  });
}


// ========== SAVE TO LIBRARY FEATURE ==========
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".book-card");
    const img = card.querySelector("img").src;
    const title = card.querySelector("h4, h3").textContent;
    const author = card.querySelector("p") ? card.querySelector("p").textContent.replace("by ", "") : "";

    let library = JSON.parse(localStorage.getItem("myLibrary")) || [];

    // Prevent duplicates
    if (library.some(book => book.title === title)) {
      alert("This book is already in your library!");
      return;
    }

    library.push({ img, title, author });
    localStorage.setItem("myLibrary", JSON.stringify(library));
    alert(`✅ "${title}" has been saved to your Library!`);
  }
});


// ========== LOAD LIBRARY PAGE ==========
const libraryContainer = document.querySelector(".saved-books-container");
if (libraryContainer) {
  const library = JSON.parse(localStorage.getItem("myLibrary")) || [];

  if (library.length === 0) {
    libraryContainer.innerHTML = `<p style="text-align:center; color:#555;">No books saved yet. Go explore and save some!</p>`;
  } else {
    libraryContainer.innerHTML = library.map(book => `
      <div class="book-card">
        <img src="${book.img}" alt="${book.title}">
        <h4>${book.title}</h4>
        <p>by ${book.author}</p>
        <div class="book-actions">
          <button class="download-btn" data-title="${book.title}">Download</button>
          <button class="remove-btn" data-title="${book.title}">Remove</button>
        </div>
      </div>
    `).join("");
  }
}

