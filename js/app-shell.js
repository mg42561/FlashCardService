export const appShell = `
    <div class="app-container">
        <header class="app-header">
            <h1>FlashCard App</h1>
            <div class="theme-toggle">
                <button id="themeToggle" class="btn-icon" data-js="theme-toggle" aria-label="Toggle dark/light mode">
                    <span class="theme-icon">🌓</span>
                </button>
            </div>
        </header>
        
        <main class="main-content">
            <div class="category-selector">
                <label for="category">Select Category:</label>
                <select id="category" aria-label="Select flashcard category">
                    <option value="">-- Select a category --</option>
                </select>
            </div>

            <div class="category-selector card-selection">
                <div class="card-picker">
                    <label for="cardSelect">Select Card</label>
                    <select id="cardSelect" disabled>
                        <option value="">No cards available</option>
                    </select>
                </div>
            </div>

            <div class="flashcard-container">
                <div class="flashcard" tabindex="0" role="button" aria-pressed="false">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            <span class="flashcard-side-label"></span>
                            <div class="card-content">
                                <div class="card-body">Select a category to begin</div>
                            </div>
                            <span class="flashcard-term-id" hidden></span>
                        </div>
                        <div class="flashcard-back">
                            <span class="flashcard-side-label"></span>
                            <div class="card-content">
                                <div class="card-body">Your flashcard answer will appear here</div>
                            </div>
                            <span class="flashcard-term-id" hidden></span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-navigation">
                <button id="prevBtn" class="btn-base" data-js="nav-prev" disabled>← Previous</button>
                <span id="cardCounter" class="card-counter" aria-live="polite">0/0</span>
                <button id="nextBtn" class="btn-base" data-js="nav-next" disabled>Next →</button>
            </div>

            <div class="action-buttons">
                <button id="viewDeckBtn" type="button" class="btn-base" disabled>View All Cards (new window)</button>
                <button id="clearFavoritesBtn" class="btn-base btn-warning" data-js="clear-favorites" style="display: none;">
                    Clear Favorites
                </button>
            </div>
            <div class="mode-control" role="group" aria-labelledby="modeLabel">
                <span id="modeLabel">Mode</span>
                <button id="orderToggle" type="button" class="btn-base" aria-label="Random card order" aria-pressed="true">Random</button>
            </div>
        </main>
    </div>
`;
