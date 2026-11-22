// Import modules
import Storage from './storage.js';
import Favorites from './favorites.js';
import { renderCardContent } from './card-content.js';
import { appShell } from './app-shell.js';

document.body.insertAdjacentHTML('afterbegin', appShell);
const configuredDeck = document.body.dataset.deck;
const appHeading = document.querySelector('.app-header h1');

// DOM Elements
const flashcard = document.querySelector('.flashcard');
const flashcardFront = document.querySelector('.flashcard-front .card-body');
const flashcardBack = document.querySelector('.flashcard-back .card-body');
const termIDLabels = flashcard.querySelectorAll('.flashcard-term-id');
const cardCounter = document.getElementById('cardCounter');
const categorySelect = document.getElementById('category');
const cardSelect = document.getElementById('cardSelect');
const orderToggle = document.getElementById('orderToggle');
const viewDeckBtn = document.getElementById('viewDeckBtn');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');

// Cache DOM elements with data-js attributes
const elements = {
  prevBtn: document.querySelector('[data-js="nav-prev"]'),
  nextBtn: document.querySelector('[data-js="nav-next"]'),
  themeToggle: document.querySelector('[data-js="theme-toggle"]'),
  clearFavoritesBtn: clearFavoritesBtn,
  categorySelect: categorySelect
};

// State
let currentDeck = [];
let sourceDeck = [];
let currentCardIndex = 0;
let randomOrder = true;
let categoryRequest = 0;
let isFlipped = false;
let deckName = '';
let currentCategory = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
    
    // Set up event listeners
    setupEventListeners();

    if (configuredDeck) {
        categorySelect.closest('.category-selector').hidden = true;
        deckName = document.title;
        appHeading.textContent = deckName;
        flashcardFront.textContent = 'Loading cards…';
        loadCategory(configuredDeck, ++categoryRequest);
        return;
    }
    
    // Load available categories
    loadCategories();
    
    // Auto-select and load the first category if available
    if (categorySelect.options.length > 1) {
        categorySelect.selectedIndex = 1;
        categorySelect.dispatchEvent(new Event('change'));
    }
});

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Category selection
    categorySelect?.addEventListener('change', handleCategoryChange);
    cardSelect.addEventListener('change', () => {
        const selectedCard = sourceDeck[Number(cardSelect.value)];
        const index = currentDeck.indexOf(selectedCard);
        if (index < 0) return;
        currentCardIndex = index;
        updateCardDisplay();
    });
    orderToggle.addEventListener('click', () => {
        randomOrder = !randomOrder;
        orderToggle.textContent = randomOrder ? 'Random' : 'Linear';
        orderToggle.setAttribute('aria-pressed', String(randomOrder));
        applyCardOrder(currentDeck[currentCardIndex]);
    });
    
    // Navigation buttons
    elements.prevBtn?.addEventListener('click', showPreviousCard);
    elements.nextBtn?.addEventListener('click', showNextCard);
    
    // Card interaction
    flashcard?.addEventListener('click', toggleCard);
    viewDeckBtn.addEventListener('click', openDeckView);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // Clear favorites button
    elements.clearFavoritesBtn.addEventListener('click', handleClearFavorites);
}

// Load available categories
function loadCategories() {
    // Clear existing options except the first one
    while (elements.categorySelect.options.length > 1) {
        elements.categorySelect.remove(1);
    }
    
    // Add regular categories
const categories = [
    { value: 'technicalSupportFundamentals', label: 'Technical Support Fundamentals' },
    { value: 'bitsAndBytesComputerNetworking', label: 'Bits and Bytes Computer Networking' },
    { value: 'geometry', label: 'Geometry' }
];
    
    categories.forEach(cat => {
        const option = new Option(cat.label, cat.value);
        elements.categorySelect.add(option);
    });
    
    // Add favorites if they exist
    updateFavoritesOption();
}

// Update favorites option in the dropdown
function updateFavoritesOption() {
    // Remove existing favorites option if it exists
    const existingFavOption = Array.from(elements.categorySelect.options)
        .find(opt => opt.value === 'favorites');
    
    if (existingFavOption) {
        existingFavOption.remove();
    }
    
    // Add favorites option if there are favorites
    if (Favorites.hasFavorites()) {
        const option = new Option('Favorites', 'favorites');
        elements.categorySelect.add(option);
    }
    
    // Show/hide clear favorites button
    updateClearFavoritesButton();
}

// Update clear favorites button visibility
function updateClearFavoritesButton() {
    elements.clearFavoritesBtn.style.display = (currentCategory === 'favorites') ? 'inline-block' : 'none';
}

// Handle category change
function handleCategoryChange(e) {
    const category = e.target.value;
    const request = ++categoryRequest;
    currentCategory = category;
    deckName = categorySelect.selectedOptions[0]?.textContent || 'Flashcards';
    
    // Update favorites button visibility based on selected category
    updateClearFavoritesButton();
    
    if (category === 'favorites') {
        loadFavorites();
    } else {
        setDeck([]);
        if (category) loadCategory(`data/${category}.json`, request);
    }
}

// Load favorites
function loadFavorites() {
    const favsByCategory = Favorites.getFavoritesByCategory();
    setDeck(Object.values(favsByCategory).flat());
}

// Load category
async function loadCategory(deckPath, request) {
    try {
        const response = await fetch(deckPath);
        if (!response.ok) throw new Error('Failed to load category');
        
        const deck = await response.json();
        if (request !== categoryRequest) return;
        deckName = deck.name || deckName;
        if (configuredDeck) {
            appHeading.textContent = deckName;
            document.title = deckName;
        }
        setDeck(deck.cards);
    } catch (error) {
        if (request !== categoryRequest) return;
        console.error('Error loading category:', error);
        if (configuredDeck) {
            flashcardFront.textContent = 'Could not load the deck.';
            return;
        }
        alert('Failed to load the selected category. Please try again.');
    }
}

function setDeck(cards) {
    sourceDeck = cards;
    viewDeckBtn.disabled = !cards.length;
    const options = cards.map((card, index) => {
        const id = String(card.termID ?? '').trim();
        return new Option(id || `Card ${index + 1}`, String(index));
    });
    cardSelect.replaceChildren(...(options.length ? options : [new Option('No cards available', '')]));
    cardSelect.disabled = !options.length;
    applyCardOrder();
}

function applyCardOrder(selectedCard) {
    currentDeck = randomOrder ? shuffleArray(sourceDeck) : sourceDeck;
    currentCardIndex = Math.max(0, currentDeck.indexOf(selectedCard));
    updateCardDisplay();
}

// Update card display
function updateCardDisplay() {
    const currentCard = currentDeck[currentCardIndex];
    cardSelect.value = currentCard ? String(sourceDeck.indexOf(currentCard)) : '';
    cardCounter.textContent = currentCard ? `${currentCardIndex + 1}/${currentDeck.length}` : '0/0';
    elements.prevBtn.disabled = currentCardIndex === 0;
    elements.nextBtn.disabled = currentCardIndex >= currentDeck.length - 1;
    resetCardState();
    const termID = currentCard?.termID;
    const idText = typeof termID === 'string' || typeof termID === 'number'
        ? String(termID).trim()
        : '';
    for (const label of termIDLabels) {
        label.textContent = idText;
        label.hidden = !idText;
    }

    if (!currentCard) {
        // Handle empty state
        flashcardFront.textContent = 'No cards available';
        flashcardBack.textContent = 'Select a category to begin';
        return;
    }
    
    renderCardContent(flashcardFront, currentCard.term, currentCard.termFormat);
    renderCardContent(flashcardBack, currentCard.definition, currentCard.definitionFormat);
}

function openDeckView() {
    const popup = window.open('', '_blank', 'popup,width=1100,height=800');
    if (!popup) {
        alert('Allow pop-ups for this site to open the deck view.');
        return;
    }
    popup.opener = null;

    const view = popup.document;
    view.title = deckName;
    view.documentElement.lang = document.documentElement.lang || 'en';
    view.documentElement.dataset.theme = document.documentElement.dataset.theme;
    const viewport = view.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    const stylesheet = view.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('css/style.css', document.baseURI).href;
    view.head.append(viewport, stylesheet);

    const main = view.createElement('main');
    main.className = 'deck-view';
    const heading = view.createElement('h1');
    heading.textContent = deckName;

    const table = view.createElement('table');
    table.setAttribute('aria-label', deckName);
    const header = table.createTHead().insertRow();
    for (const column of ['Question', 'Answer']) {
        const cell = view.createElement('th');
        cell.scope = 'col';
        cell.textContent = column;
        header.append(cell);
    }

    const rows = table.createTBody();
    for (const card of sourceDeck) {
        const row = rows.insertRow();
        const question = row.insertCell();
        const answer = row.insertCell();
        const termID = String(card.termID ?? '').trim();
        if (termID) {
            const id = view.createElement('div');
            id.className = 'deck-view-term-id';
            id.textContent = termID;
            question.append(id);
        }
        const term = view.createElement('div');
        renderCardContent(term, card.term, card.termFormat);
        question.append(term);
        renderCardContent(answer, card.definition, card.definitionFormat);
    }
    main.append(heading, table);
    view.body.append(main);
}

// Navigation functions
function showNextCard() {
    if (currentCardIndex < currentDeck.length - 1) {
        currentCardIndex++;
        updateCardDisplay();
    }
}

function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        updateCardDisplay();
    }
}

// Toggle card flip
function toggleCard() {
    const flashcard = document.querySelector('.flashcard');
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

// Handle keyboard navigation
function handleKeyDown(event) {
    if (currentDeck.length === 0 || event.target.closest('select, input, textarea, button, a')) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            if (!elements.prevBtn.disabled) showPreviousCard();
            break;
        case 'ArrowRight':
            if (!elements.nextBtn.disabled) showNextCard();
            break;
        case ' ':
        case 'Enter':
            event.preventDefault();
            toggleCard();
            break;
    }
}

// Theme functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = theme === 'dark' ? '☀️' : '🌓';
    elements.themeToggle.querySelector('.theme-icon').textContent = icon;
}

// Utility function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Reset card to front view
function resetCardState() {
    if (isFlipped) {
        flashcard.classList.remove('flipped');
        isFlipped = false;
    }
}

// Handle clear favorites
function handleClearFavorites() {
    if (confirm('Are you sure you want to clear all favorites? This action cannot be undone.')) {
        Favorites.clearAll();
        
        // Remove favorites option from dropdown
        const favoritesOption = Array.from(elements.categorySelect.options)
            .find(opt => opt.value === 'favorites');
        
        if (favoritesOption) {
            favoritesOption.remove();
        }
        
        // Hide clear favorites button
        elements.clearFavoritesBtn.style.display = 'none';
        
        // If currently viewing favorites, reset to first category
        if (currentCategory === 'favorites') {
            categorySelect.selectedIndex = categorySelect.options.length > 1 ? 1 : 0;
            categorySelect.dispatchEvent(new Event('change'));
        } else {
            // Just update the UI to reflect the change
            updateFavoritesOption();
        }
        
    }
}
