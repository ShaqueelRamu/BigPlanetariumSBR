
/* 
  1. MOBILE NAVIGATION TOGGLE
   When the hamburger button is clicked, the nav menu is toggled
   open/closed. 
*/

const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', function () {
    // Check current state
    const isOpen = primaryNav.classList.contains('open');

    // Toggle nav visibility
    primaryNav.classList.toggle('open');

    // Update ARIA attribute so screen readers announce the new state
    navToggle.setAttribute('aria-expanded', !isOpen);

    // Animate hamburger bars into an X when open
    // simple visual cue that doesnt need extra CSS classes
    const bars = navToggle.querySelectorAll('.hamburger-bar');
    if (!isOpen) {
      bars[0].style.transform = 'translateY(7px) rotate(45deg)';
      bars[1].style.opacity  = '0';
      bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      navToggle.setAttribute('aria-label', 'Close navigation menu');
    } else {
      bars[0].style.transform = '';
      bars[1].style.opacity  = '';
      bars[2].style.transform = '';
      navToggle.setAttribute('aria-label', 'Open navigation menu');
    }
  });

  // Close nav if user clicks outside of the header area
  document.addEventListener('click', function (event) {
    if (!navToggle.contains(event.target) && !primaryNav.contains(event.target)) {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close nav on Escape key for keyboard accessibility
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && primaryNav.classList.contains('open')) {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus(); // return focus to the toggle button
    }
  });
}


/* 
   2. SCROLL-TO-TOP BUTTON
   Shows the button after scrolling down 400px. Clicking it
   smoothly scrolls back to the top.
*/

const scrollTopBtn = document.getElementById('scrollTopBtn');

if (scrollTopBtn) {
  // Show/hide based on scroll position
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }, { passive: true }); // passive: true improves scroll performance

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Move focus to the top of the page for keyboard users
    document.querySelector('.skip-link').focus();
  });
}


/* 
   3. IMAGE CAROUSEL
   Initialises a carousel for every .carousel element on the page.
   Each one is independent — prev/next/dots all scoped to their
   own carousel container.
*/

function initCarousel(carousel) {
  const track  = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots   = carousel.querySelectorAll('.dot');
  const prevBtn = carousel.querySelectorAll('.carousel-btn')[0];
  const nextBtn = carousel.querySelectorAll('.carousel-btn')[1];

  if (!track || slides.length === 0) return;

  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, slides.length - 1));
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', i !== currentIndex));
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
      dot.setAttribute('aria-label', `Go to slide ${i + 1}${i === currentIndex ? ' (current)' : ''}`);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex === slides.length - 1 ? 0 : currentIndex + 1));

  dots.forEach(dot => dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index, 10))));

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToSlide(currentIndex === 0 ? slides.length - 1 : currentIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goToSlide(currentIndex === slides.length - 1 ? 0 : currentIndex + 1); }
  });

  goToSlide(0);
}

// Initialise all carousels on the page
document.querySelectorAll('.carousel').forEach(initCarousel);


/* 
   4. PLANET TAB SWITCHER
   Switches between Mars, Saturn, and Jupiter panels on planet.html.
   Uses ARIA tab pattern: aria-selected, tabindex, and keyboard
   navigation with arrow keys.
*/

const tabButtons = document.querySelectorAll('.tab-btn[role="tab"]');
const tabPanels  = document.querySelectorAll('.planet-panel[role="tabpanel"]');

if (tabButtons.length > 0) {
  /**
   * Activates the tab button and shows its associated panel.
   * @param {HTMLButtonElement} selectedTab - the tab to activate
   */
  function activateTab(selectedTab) {
    // Deactivate all tabs
    tabButtons.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1'); // removed from tab order
    });

    // Hide all panels
    tabPanels.forEach(function (panel) {
      panel.classList.add('hidden');
    });

    // Activate the selected tab
    selectedTab.classList.add('active');
    selectedTab.setAttribute('aria-selected', 'true');
    selectedTab.setAttribute('tabindex', '0'); // back in tab order
    selectedTab.focus();

    // Show the associated panel
    const targetPanelId = selectedTab.getAttribute('aria-controls');
    const targetPanel   = document.getElementById(targetPanelId);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }
  }

  tabButtons.forEach(function (btn, index) {
    btn.addEventListener('click', function () {
      activateTab(btn);
    });

    // Arrow key navigation between tabs (ARIA tablist pattern)
    btn.addEventListener('keydown', function (event) {
      let targetIndex;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        targetIndex = (index + 1) % tabButtons.length;
        activateTab(tabButtons[targetIndex]);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        activateTab(tabButtons[targetIndex]);
      }
    });
  });

  // Initialise: ensure first tab is active
  tabButtons[0].setAttribute('tabindex', '0');
  tabButtons.forEach(function (btn, i) {
    if (i > 0) btn.setAttribute('tabindex', '-1');
  });
}


/* 
   5. PLANET SIZE COMPARISON TOOL
   Takes two planet selections and renders proportional circles
   to visually compare their diameters. Results are announced to
   screen readers via aria-live="polite".
*/

// Planet data: diameter in km and a rough colour for the visual circle
const PLANET_DATA = {
  mercury: { name: 'Mercury',  diameter: 4879,    color: '#b5b5b5' },
  venus:   { name: 'Venus',    diameter: 12104,   color: '#e8c97a' },
  earth:   { name: 'Earth',    diameter: 12742,   color: '#3b82f6' },
  mars:    { name: 'Mars',     diameter: 6779,    color: '#c1440e' },
  jupiter: { name: 'Jupiter',  diameter: 139820,  color: '#c88b3a' },
  saturn:  { name: 'Saturn',   diameter: 116460,  color: '#e4c87a' },
  uranus:  { name: 'Uranus',   diameter: 50724,   color: '#7de8e8' },
  neptune: { name: 'Neptune',  diameter: 49244,   color: '#3f54ba' },
};

const compareBtn      = document.getElementById('compareBtn');
const comparisonResult = document.getElementById('comparisonResult');

if (compareBtn && comparisonResult) {
  compareBtn.addEventListener('click', function () {
    const planet1Key = document.getElementById('planet1').value;
    const planet2Key = document.getElementById('planet2').value;

    const p1 = PLANET_DATA[planet1Key];
    const p2 = PLANET_DATA[planet2Key];

    if (!p1 || !p2) return;

    // Find the larger planet so we can scale both circles relative to it
    const maxDiameter = Math.max(p1.diameter, p2.diameter);

    // Max visual circle size in pixels capped to keep it on screen
    const MAX_PX = 160;

    const size1 = Math.round((p1.diameter / maxDiameter) * MAX_PX);
    const size2 = Math.round((p2.diameter / maxDiameter) * MAX_PX);

    // Calculate how many times bigger one is than the other
    const ratio = p1.diameter > p2.diameter
      ? (p1.diameter / p2.diameter).toFixed(1)
      : (p2.diameter / p1.diameter).toFixed(1);

    const biggerName  = p1.diameter >= p2.diameter ? p1.name : p2.name;
    const smallerName = p1.diameter < p2.diameter  ? p1.name : p2.name;

    // Build result HTML
    // I used inline styles here because these values are dynamic 
    comparisonResult.innerHTML = `
      <div class="compare-planet-display">
        <div
          class="compare-circle"
          style="width: ${size1}px; height: ${size1}px; --planet-color: ${p1.color};"
          role="img"
          aria-label="${p1.name} size circle, diameter ${p1.diameter.toLocaleString()} km"
        ></div>
        <p class="compare-planet-name">${p1.name}</p>
        <p class="compare-planet-size">${p1.diameter.toLocaleString()} km</p>
      </div>

      <div class="compare-planet-display">
        <div
          class="compare-circle"
          style="width: ${size2}px; height: ${size2}px; --planet-color: ${p2.color};"
          role="img"
          aria-label="${p2.name} size circle, diameter ${p2.diameter.toLocaleString()} km"
        ></div>
        <p class="compare-planet-name">${p2.name}</p>
        <p class="compare-planet-size">${p2.diameter.toLocaleString()} km</p>
      </div>

      <p class="compare-ratio-text">
        ${biggerName} is <strong>${ratio}x</strong> wider than ${smallerName}.
      </p>
    `;
  });

  // Trigger a default comparison on page load so the section isn't empty
  compareBtn.click();
}


/*
   6. FORM VALIDATION
*/

/**
 * Validates a single text/email input field.
 * Shows an error message if invalid, clears it if valid.
 * Also adds/removes an 'error' class for visual styling.
 *
 * @param {HTMLInputElement} input - the input to validate
 * @param {HTMLElement} errorEl    - the element to display error messages in
 * @returns {boolean} - true if valid
 */
function validateField(input, errorEl) {
  const value = input.value.trim();

  // Required field check
  if (input.required && value === '') {
    showError(input, errorEl, 'This field is required.');
    return false;
  }

  // Email format check
  if (input.type === 'email' && value !== '') {
    // Basic email pattern – not perfect but good enough for front-end validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showError(input, errorEl, 'Please enter a valid email address.');
      return false;
    }
  }

  // All checks passed
  clearError(input, errorEl);
  return true;
}

/**
 * Displays an error message and marks the input as errored.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
function showError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.add('error');
  input.setAttribute('aria-invalid', 'true');
}

/**
 * Clears any error on a field.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorEl
 */
function clearError(input, errorEl) {
  errorEl.textContent = '';
  input.classList.remove('error');
  input.setAttribute('aria-invalid', 'false');
}


/* --- Newsletter form (visit.html) --- */
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', function (event) {
    // Prevent the default form submission (no server in this prototype)
    event.preventDefault();

    const firstNameInput = document.getElementById('firstName');
    const emailInput     = document.getElementById('emailAddr');
    const firstNameError = document.getElementById('firstName-error');
    const emailError     = document.getElementById('email-error');

    // Validate all fields
    const isFirstNameValid = validateField(firstNameInput, firstNameError);
    const isEmailValid     = validateField(emailInput, emailError);

    if (isFirstNameValid && isEmailValid) {
      // Hide the form and show success message
      // In a real project this would send data to a server
      newsletterForm.querySelector('.btn').setAttribute('disabled', 'true');
      const successEl = document.getElementById('formSuccess');
      successEl.removeAttribute('hidden');
      successEl.focus(); // move focus so screen reader announces the message
    } else {
      // Focus the first invalid field to help keyboard users
      if (!isFirstNameValid) {
        firstNameInput.focus();
      } else {
        emailInput.focus();
      }
    }
  });

  // Clear errors on input (once user starts correcting)
  ['firstName', 'emailAddr'].forEach(function (id) {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', function () {
        const errorEl = document.getElementById(id === 'firstName' ? 'firstName-error' : 'email-error');
        if (input.value.trim() !== '') {
          clearError(input, errorEl);
        }
      });
    }
  });
}


/* --- Contact form (about.html) --- */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const nameInput    = document.getElementById('contactName');
    const emailInput   = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');
    const nameError    = document.getElementById('cname-error');
    const emailError   = document.getElementById('cemail-error');
    const msgError     = document.getElementById('cmsg-error');

    const isNameValid    = validateField(nameInput,    nameError);
    const isEmailValid   = validateField(emailInput,   emailError);
    const isMessageValid = validateField(messageInput, msgError);

    if (isNameValid && isEmailValid && isMessageValid) {
      // Show success message
      contactForm.querySelector('.btn').setAttribute('disabled', 'true');
      const successEl = document.getElementById('contactFormSuccess');
      successEl.removeAttribute('hidden');
      successEl.focus();
    } else {
      // Focus the first invalid field
      if (!isNameValid)    nameInput.focus();
      else if (!isEmailValid) emailInput.focus();
      else                 messageInput.focus();
    }
  });

  // Clear errors on input
  ['contactName', 'contactEmail', 'contactMessage'].forEach(function (id) {
    const input = document.getElementById(id);
    const errorMap = {
      contactName:    'cname-error',
      contactEmail:   'cemail-error',
      contactMessage: 'cmsg-error',
    };
    if (input) {
      input.addEventListener('input', function () {
        const errorEl = document.getElementById(errorMap[id]);
        if (input.value.trim() !== '') {
          clearError(input, errorEl);
        }
      });
    }
  });
}


/*
   7. SPACE QUIZ (visit.html)
   Five multiple-choice questions. Shows correct/wrong feedback
   after each answer, then a final score with a message.
*/

const QUIZ_QUESTIONS = [
  {
    question: 'How many planets are in our solar system?',
    options: ['7', '8', '9', '10'],
    correct: 1,
    feedback: 'Eight! Pluto was reclassified as a dwarf planet in 2006, which upset a lot of people.'
  },
  {
    question: 'What is the largest planet in our solar system?',
    options: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'],
    correct: 2,
    feedback: 'Jupiter! It\'s so big you could fit 1,300 Earths inside it.'
  },
  {
    question: 'Roughly how old is the universe?',
    options: ['4.5 billion years', '13.8 billion years', '100 billion years', '1 trillion years'],
    correct: 1,
    feedback: '13.8 billion years — give or take a few hundred million. Our solar system is only about 4.6 billion years old, so we\'re relative newcomers.'
  },
  {
    question: 'What is a light-year a measure of?',
    options: ['Time', 'Speed', 'Distance', 'Brightness'],
    correct: 2,
    feedback: 'Distance! It\'s the distance light travels in one year — about 9.46 trillion kilometres. Nothing in the universe travels faster than light.'
  },
  {
    question: 'Which planet has the most moons?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correct: 1,
    feedback: 'Saturn! As of 2023 it has 146 confirmed moons, pipping Jupiter\'s 95. The count keeps going up as better telescopes find smaller ones.'
  }
];

const quizProgress     = document.getElementById('quizProgress');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizOptions      = document.getElementById('quizOptions');
const quizFeedback     = document.getElementById('quizFeedback');
const quizResult       = document.getElementById('quizResult');
const quizScore        = document.getElementById('quizScore');
const quizResultMsg    = document.getElementById('quizResultMsg');
const quizRestartBtn   = document.getElementById('quizRestartBtn');
const quizQuestionArea = document.getElementById('quizQuestionArea');

if (quizQuestionText) {
  let currentQuestion = 0;
  let score = 0;

  /** Renders the current question and its answer buttons */
  function showQuestion() {
    const q = QUIZ_QUESTIONS[currentQuestion];

    quizProgress.textContent = `Question ${currentQuestion + 1} of ${QUIZ_QUESTIONS.length}`;
    quizQuestionText.textContent = q.question;
    quizFeedback.textContent = '';
    quizOptions.innerHTML = '';

    q.options.forEach(function (optionText, index) {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = optionText;
      btn.addEventListener('click', function () {
        handleAnswer(index);
      });
      quizOptions.appendChild(btn);
    });

    // Focus the question text for screen reader announcement
    quizQuestionText.focus();
  }

  /** Handles an answer selection */
  function handleAnswer(selectedIndex) {
    const q = QUIZ_QUESTIONS[currentQuestion];
    const allBtns = quizOptions.querySelectorAll('.quiz-option-btn');

    // Disable all buttons so they can't answer again
    allBtns.forEach(function (btn) {
      btn.disabled = true;
    });

    // Mark correct and wrong
    allBtns[q.correct].classList.add('correct');
    if (selectedIndex !== q.correct) {
      allBtns[selectedIndex].classList.add('wrong');
    } else {
      score++;
    }

    // Show feedback text
    quizFeedback.textContent = q.feedback;

    // Move to next question after a short delay, or show result
    setTimeout(function () {
      currentQuestion++;
      if (currentQuestion < QUIZ_QUESTIONS.length) {
        showQuestion();
      } else {
        showResult();
      }
    }, 2200);
  }

  /** Shows the final score screen */
  function showResult() {
    quizQuestionArea.classList.add('hidden');
    quizResult.classList.remove('hidden');
    quizProgress.textContent = 'Finished!';

    quizScore.textContent = `${score} / ${QUIZ_QUESTIONS.length}`;

    // Different messages based on score
    const messages = [
      'Hmm. Maybe spend some more time on the planets page 😅',
      'Not bad! A few things to brush up on.',
      'Solid effort — you clearly know your stuff.',
      'Really good! Almost perfect.',
      'Full marks! You\'re basically an astronomer. 🌟'
    ];
    quizResultMsg.textContent = messages[score] || messages[0];

    quizResult.focus();
  }

  /** Resets the quiz back to the start */
  function restartQuiz() {
    currentQuestion = 0;
    score = 0;
    quizResult.classList.add('hidden');
    quizQuestionArea.classList.remove('hidden');
    showQuestion();
  }

  if (quizRestartBtn) {
    quizRestartBtn.addEventListener('click', restartQuiz);
  }

  // Make question text focusable for screen reader announcements
  quizQuestionText.setAttribute('tabindex', '-1');

  // Start the quiz
  showQuestion();
}


/*
   7. WEIGHT ON OTHER PLANETS CALCULATOR
   Takes the user's Earth weight and multiplies by each planet's
   surface gravity relative to Earth (1g = 9.807 m/s²).
*/

const PLANET_GRAVITY = [
  { name: 'Mercury', emoji: '🪨', gravity: 0.38, note: 'You\'d feel very light!' },
  { name: 'Venus',   emoji: '☁️', gravity: 0.91, note: 'Almost the same as Earth' },
  { name: 'Mars',    emoji: '🔴', gravity: 0.38, note: 'Same as Mercury, surprisingly' },
  { name: 'Jupiter', emoji: '🟠', gravity: 2.34, note: 'You\'d struggle to stand up' },
  { name: 'Saturn',  emoji: '🪐', gravity: 1.06, note: 'Barely heavier than on Earth' },
  { name: 'Uranus',  emoji: '🔵', gravity: 0.92, note: 'Slightly lighter than Earth' },
  { name: 'Neptune', emoji: '🌊', gravity: 1.19, note: 'A bit heavier than on Earth' },
  { name: 'Moon',    emoji: '🌕', gravity: 0.17, note: 'You could jump really high!' },
];

const calcWeightBtn = document.getElementById('calcWeightBtn');
const weightResults = document.getElementById('weightResults');
const weightInput   = document.getElementById('weightInput');
const btnKg         = document.getElementById('btnKg');
const btnLbs        = document.getElementById('btnLbs');

let currentUnit = 'kg';

if (btnKg && btnLbs) {
  btnKg.addEventListener('click', function () {
    currentUnit = 'kg';
    btnKg.classList.add('active');
    btnKg.setAttribute('aria-pressed', 'true');
    btnLbs.classList.remove('active');
    btnLbs.setAttribute('aria-pressed', 'false');
  });

  btnLbs.addEventListener('click', function () {
    currentUnit = 'lbs';
    btnLbs.classList.add('active');
    btnLbs.setAttribute('aria-pressed', 'true');
    btnKg.classList.remove('active');
    btnKg.setAttribute('aria-pressed', 'false');
  });
}

if (calcWeightBtn && weightResults) {
  calcWeightBtn.addEventListener('click', function () {
    const raw = parseFloat(weightInput.value);

    if (!raw || raw <= 0 || raw > 500) {
      weightResults.innerHTML = '<p style="color: var(--accent-orange);">Please enter a valid weight between 1 and 500.</p>';
      return;
    }

    /* Convert to kg if user entered lbs */
    const weightKg = currentUnit === 'lbs' ? raw * 0.453592 : raw;

    weightResults.innerHTML = PLANET_GRAVITY.map(function (planet) {
      const result = (weightKg * planet.gravity).toFixed(1);
      /* Show result in whichever unit the user chose */
      const display = currentUnit === 'lbs'
        ? (result / 0.453592).toFixed(1) + ' lbs'
        : result + ' kg';

      return `
        <div class="weight-card">
          <span class="weight-planet-emoji" aria-hidden="true">${planet.emoji}</span>
          <p class="weight-planet-name">${planet.name}</p>
          <p class="weight-value">${display}</p>
          <p class="weight-gravity">Gravity: ${planet.gravity}g</p>
          <p class="weight-note">${planet.note}</p>
        </div>
      `;
    }).join('');
  });

  /* Also trigger on Enter key in the input */
  weightInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') calcWeightBtn.click();
  });
}


