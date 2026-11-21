// Import modules
import Storage from './storage.js';
import Favorites from './favorites.js';
import { renderCardContent } from './card-content.js';

// DOM Elements
const flashcard = document.querySelector('.flashcard');
const flashcardFront = document.querySelector('.flashcard-front .card-body');
const flashcardBack = document.querySelector('.flashcard-back .card-body');
const termIDLabels = flashcard.querySelectorAll('.flashcard-term-id');
const cardCounter = document.getElementById('cardCounter');
const categorySelect = document.getElementById('category');
const cardSelect = document.getElementById('cardSelect');
const orderToggle = document.getElementById('orderToggle');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');

// Cache DOM elements with data-js attributes
const elements = {
  prevBtn: document.querySelector('[data-js="nav-prev"]'),
  nextBtn: document.querySelector('[data-js="nav-next"]'),
  flipBtn: document.querySelector('[data-js="flip-btn"]'),
  explainMoreBtn: document.querySelector('[data-js="explain-btn"]'),
  themeToggle: document.querySelector('[data-js="theme-toggle"]'),
  favoriteBtn: document.getElementById('favoriteBtn'),
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
let data = {};
let currentCategory = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
    
    // Set up event listeners
    setupEventListeners();
    
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
    elements.flipBtn?.addEventListener('click', toggleCard);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // Favorites button
    elements.favoriteBtn.addEventListener('click', handleFavoriteClick);
    
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
    data = {};
    
    // Update favorites button visibility based on selected category
    updateClearFavoritesButton();
    
    if (category === 'favorites') {
        loadFavorites();
    } else {
        setDeck([]);
        if (category) loadCategory(category, request);
    }
}

// Load favorites
function loadFavorites() {
    const favsByCategory = Favorites.getFavoritesByCategory();
    setDeck(Object.values(favsByCategory).flat());
}

// Load category
async function loadCategory(category, request) {
    try {
        const response = await fetch(`data/${category}.json`);
        if (!response.ok) throw new Error('Failed to load category');
        
        const deck = await response.json();
        if (request !== categoryRequest) return;
        data = deck;
        setDeck(deck.cards);
    } catch (error) {
        if (request !== categoryRequest) return;
        console.error('Error loading category:', error);
        alert('Failed to load the selected category. Please try again.');
    }
}

function setDeck(cards) {
    sourceDeck = cards;
    const preview = document.createElement('div');
    const options = cards.map((card, index) => {
        const id = String(card.termID ?? '').trim();
        const term = renderCardContent(preview, card.term, card.termFormat) || '';
        const summary = term.replace(/\s+/g, ' ').trim();
        const label = [id, summary.length > 80 ? summary.slice(0, 79) + '…' : summary]
            .filter(Boolean).join(' — ');
        return new Option(label ? `${index + 1}. ${label}` : `Card ${index + 1}`, String(index));
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
        elements.flipBtn.disabled = true;
        elements.explainMoreBtn.style.display = 'none';
        elements.favoriteBtn.style.display = 'none';
        return;
    }
    
    const searchTerm = renderCardContent(flashcardFront, currentCard.term, currentCard.termFormat);
    renderCardContent(flashcardBack, currentCard.definition, currentCard.definitionFormat);
    
    elements.flipBtn.disabled = false;
    
    // Update explain more link
    updateExplainMoreLink(searchTerm);
    elements.explainMoreBtn.style.display = 'inline-block';
    
    // Update favorite button
    updateFavoriteButton();
    
}

// Update explain more link
function updateExplainMoreLink(term) {
    const searchTerm = term.replace('?', '');
    const searchContext = data.searchContext ? ` ${data.searchContext}` : '';
    elements.explainMoreBtn.href = `https://copilot.microsoft.com/?q=${encodeURIComponent(searchTerm + searchContext)}`;
    elements.explainMoreBtn.target = '_blank';
    elements.explainMoreBtn.rel = 'noopener noreferrer';
}

// Handle favorite button click
function handleFavoriteClick() {
    if (!currentCategory || currentCategory === 'favorites' || !currentDeck[currentCardIndex]) return;
    
    const card = currentDeck[currentCardIndex];
    Favorites.addFavorite(currentCategory, card);
    
    // Update UI
    updateFavoriteButton();
    
    // Update favorites option in dropdown if needed
    updateFavoritesOption();
}

// Update favorite button state
function updateFavoriteButton() {
    if (!elements.favoriteBtn) return;
    
    // Hide the button in Favorites view
    if (currentCategory === 'favorites' || !currentDeck.length) {
        elements.favoriteBtn.style.display = 'none';
    } else {
        elements.favoriteBtn.style.display = 'block';
        elements.favoriteBtn.textContent = 'Add to Favorites';
    }
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
        
        // Update favorite button state if needed
        if (currentDeck.length > 0) {
            updateFavoriteButton();
        }
    }
}
