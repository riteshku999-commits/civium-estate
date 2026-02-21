// ==============================
// CIVIUM ESTATE - MAIN SCRIPT
// ==============================


// 1️⃣ Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});


// 2️⃣ Navbar Background Change on Scroll
window.addEventListener("scroll", function () {
  const header = document.querySelector(".header");

  if (window.scrollY > 60) {
    header.style.background = "rgba(0, 0, 0, 0.9)";
  } else {
    header.style.background = "rgba(0, 0, 0, 0.7)";
  }
});


// 3️⃣ Initialize AOS (Animate On Scroll)
document.addEventListener("DOMContentLoaded", function () {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 1000,      // Animation speed
      easing: "ease-in-out",
      once: true,          // Only animate once
      offset: 100          // Trigger slightly before element enters view
    });
  }
});

// 4️⃣ Subtle Parallax Effect for Hero
window.addEventListener("scroll", function () {
  const hero = document.querySelector(".hero-overlay");
  let scrollPosition = window.scrollY;

  if (hero) {
    hero.style.transform = "translateY(" + scrollPosition * 0.2 + "px)";
  }
});

// 5️⃣ Animated Number Counter
const counters = document.querySelectorAll('.counter');
const speed = 200;

const startCounter = () => {
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;

      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 10);
      } else {
        counter.innerText = target;
      }
    };

    updateCount();
  });
};

// Trigger when section is visible
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      startCounter();
      observer.disconnect();
    }
  });
});

observer.observe(document.querySelector('.credibility'));

// 6️⃣ Simple Testimonial Slider
let currentSlide = 0;
const testimonials = document.querySelectorAll('.testimonial');

function showSlide(index) {
  testimonials.forEach(slide => slide.classList.remove('active'));
  testimonials[index].classList.add('active');
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % testimonials.length;
  showSlide(currentSlide);
}

setInterval(nextSlide, 4000);

// PROPERTY FILTERING
const budgetFilter = document.getElementById('budgetFilter');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const properties = document.querySelectorAll('.property-card');

function filterProperties() {
  properties.forEach(property => {
    const budget = property.getAttribute('data-budget');
    const location = property.getAttribute('data-location');
    const type = property.getAttribute('data-type');

    const matchBudget = budgetFilter.value === "all" || budget === budgetFilter.value;
    const matchLocation = locationFilter.value === "all" || location === locationFilter.value;
    const matchType = typeFilter.value === "all" || type === typeFilter.value;

    if (matchBudget && matchLocation && matchType) {
      property.style.display = "block";
    } else {
      property.style.display = "none";
    }
  });
}

budgetFilter.addEventListener('change', filterProperties);
locationFilter.addEventListener('change', filterProperties);
typeFilter.addEventListener('change', filterProperties);

// POPUP LOGIC
const popup = document.getElementById("leadPopup");
const closePopup = document.getElementById("closePopup");
const priceButtons = document.querySelectorAll(".price-btn");

priceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    popup.style.display = "flex";
  });
});

closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});



// ==============================
// HOT DEALS TAB SWITCHING
// ==============================

const tabButtons = document.querySelectorAll('.tab-btn');
const dealSliders = document.querySelectorAll('.deal-slider');

tabButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active class from all buttons and sliders
    tabButtons.forEach(b => b.classList.remove('active'));
    dealSliders.forEach(slider => slider.classList.remove('active'));

    // Add active class to clicked button
    this.classList.add('active');

    // Show corresponding slider
    const category = this.getAttribute('data-category');
    document.querySelector(`.${category}-deals`).classList.add('active');
  });
});

// ==============================
// DEAL BUTTONS TRIGGER POPUP
// ==============================

const dealButtons = document.querySelectorAll('.deal-btn');

dealButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    popup.style.display = "flex";
  });
});



// ==============================
// ENHANCED DEALS FUNCTIONALITY
// ==============================

let currentCategory = 'residential';
let currentPriceFilter = 'all';
let currentSort = 'newest';
let visibleDeals = 6; // Initially show 6 deals

// Get active deal slider
function getActiveSlider() {
  return document.querySelector(`.${currentCategory}-deals`);
}

// Get all deal cards in active slider
function getAllDeals() {
  return getActiveSlider().querySelectorAll('.deal-card');
}

// 1️⃣ PRICE RANGE FILTERING
const priceFilterButtons = document.querySelectorAll('.filter-btn');

priceFilterButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Update active button
    priceFilterButtons.forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    currentPriceFilter = this.getAttribute('data-price');
    applyFiltersAndSort();
  });
});

// 2️⃣ SORTING FUNCTIONALITY
const sortSelect = document.getElementById('sortDeals');

sortSelect.addEventListener('change', function() {
  currentSort = this.value;
  applyFiltersAndSort();
});

// 3️⃣ APPLY FILTERS AND SORTING
function applyFiltersAndSort() {
  const deals = Array.from(getAllDeals());
  
  // Reset visibility
  deals.forEach(deal => {
    deal.style.display = 'none';
    deal.classList.remove('hidden-deal');
  });

  // Filter by price
  let filteredDeals = deals.filter(deal => {
    const price = parseFloat(deal.getAttribute('data-price'));
    
    if (currentPriceFilter === 'all') return true;
    if (currentPriceFilter === '0-50') return price < 50;
    if (currentPriceFilter === '50-100') return price >= 50 && price <= 100;
    if (currentPriceFilter === '100-999') return price > 100;
    
    return true;
  });

  // Sort deals
  filteredDeals.sort((a, b) => {
    const priceA = parseFloat(a.getAttribute('data-price'));
    const priceB = parseFloat(b.getAttribute('data-price'));
    const featuredA = a.getAttribute('data-featured') === 'true';
    const featuredB = b.getAttribute('data-featured') === 'true';

    switch(currentSort) {
      case 'price-low':
        return priceA - priceB;
      case 'price-high':
        return priceB - priceA;
      case 'featured':
        if (featuredA && !featuredB) return -1;
        if (!featuredA && featuredB) return 1;
        return 0;
      case 'newest':
      default:
        return parseInt(a.getAttribute('data-index')) - parseInt(b.getAttribute('data-index'));
    }
  });

  // Re-append in sorted order
  const slider = getActiveSlider();
  filteredDeals.forEach(deal => slider.appendChild(deal));

  // Show only first 'visibleDeals' number of deals
  filteredDeals.forEach((deal, index) => {
    if (index < visibleDeals) {
      deal.style.display = 'block';
    } else {
      deal.classList.add('hidden-deal');
    }
  });

  updateLoadMoreButton(filteredDeals.length);
  updateShowingCount(filteredDeals.length);
}

// 4️⃣ LOAD MORE FUNCTIONALITY
const loadMoreBtn = document.getElementById('loadMoreBtn');

loadMoreBtn.addEventListener('click', function() {
  const deals = Array.from(getAllDeals());
  const hiddenDeals = deals.filter(deal => deal.classList.contains('hidden-deal'));
  
  // Show next 3 deals
  hiddenDeals.slice(0, 3).forEach(deal => {
    deal.style.display = 'block';
    deal.classList.remove('hidden-deal');
  });

  visibleDeals += 3;
  
  const remainingHidden = deals.filter(deal => deal.classList.contains('hidden-deal')).length;
  updateLoadMoreButton(deals.length);
  updateShowingCount(deals.length);
});

// Update Load More button state
function updateLoadMoreButton(totalDeals) {
  const hiddenDeals = Array.from(getAllDeals()).filter(deal => deal.classList.contains('hidden-deal'));
  
  if (hiddenDeals.length === 0) {
    loadMoreBtn.textContent = 'All Deals Loaded';
    loadMoreBtn.disabled = true;
  } else {
    loadMoreBtn.textContent = `Load More Deals (${hiddenDeals.length} remaining)`;
    loadMoreBtn.disabled = false;
  }
}

// Update showing count
function updateShowingCount(totalDeals) {
  const visibleCount = Array.from(getAllDeals()).filter(deal => deal.style.display === 'block').length;
  const countElement = document.querySelector('.showing-count');
  countElement.textContent = `Showing ${visibleCount} of ${totalDeals} deals`;
}

// 5️⃣ CATEGORY TAB SWITCHING (Enhanced)
const enhancedTabButtons = document.querySelectorAll('.tab-btn');

enhancedTabButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active class from all buttons and sliders
    enhancedTabButtons.forEach(b => b.classList.remove('active'));
    dealSliders.forEach(slider => slider.classList.remove('active'));

    // Add active class to clicked button
    this.classList.add('active');

    // Update current category
    currentCategory = this.getAttribute('data-category');

    // Show corresponding slider
    document.querySelector(`.${currentCategory}-deals`).classList.add('active');

    // Reset filters and visibility
    visibleDeals = 6;
    applyFiltersAndSort();
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  applyFiltersAndSort();
});




// ==============================
// EMAIL & WHATSAPP CONFIGURATION
// ==============================

// Initialize EmailJS with your Public Key
(function() {
  emailjs.init("lyKpG1clXdqatOcBq"); // Replace with your EmailJS Public Key
})();

// Your contact details
const OWNER_EMAIL = "riteshku999@gmail.com";
const OWNER_WHATSAPP = "918093172004"; // Format: country code + number (no + or spaces)

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_stseq07"; // Replace with your Service ID
const EMAILJS_TEMPLATE_ID = "template_l07jlcs"; // Replace with your Template ID

// ==============================
// CONTACT FORM HANDLING
// ==============================

const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

// Form validation
function validateForm(formData) {
  let isValid = true;
  const errors = {};

  // Name validation
  const fullName = formData.get('fullName').trim();
  if (fullName.length < 2) {
    errors.fullName = 'Please enter a valid name';
    isValid = false;
  }

  // Email validation
  const email = formData.get('email').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  // Phone validation (Indian format)
  const phone = formData.get('phone').trim();
  const phoneRegex = /^[\+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.phone = 'Please enter a valid phone number';
    isValid = false;
  }

  // Property interest validation
  const propertyInterest = formData.get('propertyInterest');
  if (!propertyInterest) {
    errors.propertyInterest = 'Please select your area of interest';
    isValid = false;
  }

  // Message validation
  const message = formData.get('message').trim();
  if (message.length < 10) {
    errors.message = 'Please enter a message (at least 10 characters)';
    isValid = false;
  }

  return { isValid, errors };
}

// Display errors
function displayErrors(errors) {
  // Clear previous errors
  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('error');
    group.querySelector('.error-message').textContent = '';
  });

  // Display new errors
  Object.keys(errors).forEach(fieldName => {
    const input = document.getElementById(fieldName);
    if (input) {
      const formGroup = input.closest('.form-group');
      formGroup.classList.add('error');
      formGroup.querySelector('.error-message').textContent = errors[fieldName];
    }
  });
}

// Send to Email via EmailJS
async function sendToEmail(formData) {
  const templateParams = {
    from_name: formData.get('fullName'),
    from_email: formData.get('email'),
    from_phone: formData.get('phone'),
    property_interest: formData.get('propertyInterest'),
    budget: formData.get('budget') || 'Not specified',
    message: formData.get('message'),
    submission_date: new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short'
    })
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('Email sent successfully!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Send to WhatsApp
function sendToWhatsApp(formData) {
  const name = formData.get('fullName');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const interest = formData.get('propertyInterest');
  const budget = formData.get('budget') || 'Not specified';
  const message = formData.get('message');

  // Format WhatsApp message
  const whatsappMessage = `*🏠 NEW PROPERTY ENQUIRY - Civium Estate*

*Name:* ${name}
*Email:* ${email}
*Phone:* ${phone}
*Interested In:* ${interest}
*Budget:* ${budget}

*Message:*
${message}

---
_Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;

  // Encode message for URL
  const encodedMessage = encodeURIComponent(whatsappMessage);
  
  // Open WhatsApp with pre-filled message
  const whatsappURL = `https://wa.me/${OWNER_WHATSAPP}?text=${encodedMessage}`;
  
  // Open in new window (will work on both desktop and mobile)
  window.open(whatsappURL, '_blank');
  
  return true;
}

// Handle form submission
contactForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(contactForm);
  const validation = validateForm(formData);

  if (!validation.isValid) {
    displayErrors(validation.errors);
    return;
  }

  // Clear errors if validation passed
  displayErrors({});

  // Show loading state
  const submitBtn = contactForm.querySelector('.submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-block';

  try {
    // Send to Email
    const emailSent = await sendToEmail(formData);
    
    if (emailSent) {
      // Send to WhatsApp (opens WhatsApp)
      sendToWhatsApp(formData);
      
      // Show success message
      contactForm.style.display = 'none';
      successMessage.style.display = 'block';

      // Reset form
      contactForm.reset();

      // Reset form state after 5 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
        contactForm.style.display = 'flex';
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
      }, 5000);
      
    } else {
      throw new Error('Email sending failed');
    }

  } catch (error) {
    console.error('Form submission error:', error);
    alert('⚠️ There was an issue sending your enquiry. Please contact us directly at:\n\nEmail: riteshku999@gmail.com\nWhatsApp: +91-8093172004');
    
    submitBtn.disabled = false;
    btnText.style.display = 'inline-block';
    btnLoader.style.display = 'none';
  }
});

// Real-time validation on blur
contactForm.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('blur', function() {
    const formData = new FormData(contactForm);
    const validation = validateForm(formData);
    
    if (validation.errors[this.id]) {
      const formGroup = this.closest('.form-group');
      formGroup.classList.add('error');
      formGroup.querySelector('.error-message').textContent = validation.errors[this.id];
    } else {
      const formGroup = this.closest('.form-group');
      formGroup.classList.remove('error');
      formGroup.querySelector('.error-message').textContent = '';
    }
  });
});

