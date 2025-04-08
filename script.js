// Cached DOM elements to reduce queries
const elements = {
    messageEl: document.getElementById("message-el"),
    sumEl: document.getElementById("sum-el"),
    cardsEl: document.getElementById("cards-el"),
    playerEl: document.getElementById("player-el"),
    dealerCardsEl: document.getElementById("dealer-cards-el"),
    dealerSumEl: document.getElementById("dealer-sum-el"),
    betEl: document.getElementById("bet-el"),
    cardsDivEl: document.getElementById("cards-div"),
    dealerCardsDivEl: document.getElementById("dealer-cards-div"),
    historyEl: document.getElementById("history-el"),
    deckEl: document.getElementById("deck"),
    statsEl: document.getElementById("stats-el"),
    betBtn: document.getElementById("bet-btn"),
    hitBtn: document.getElementById("hit-btn"),
    standBtn: document.getElementById("stand-btn"),
    continueBtn: document.getElementById("continue-btn"),
    resetBtn: document.getElementById("reset-btn"),
    betInput: document.getElementById("bet-input"),
    dealerAvatar: document.getElementById("dealer-avatar"),
    rulesToggleBtn: document.getElementById("rules-toggle-btn"),
    rules: document.getElementById("rules"),
    audioToggleBtn: document.getElementById("audio-toggle-btn") // New audio toggle button
};

// Add event listeners for buttons
elements.betBtn.addEventListener("click", placeBet);
elements.hitBtn.addEventListener("click", newCard);
elements.standBtn.addEventListener("click", stand);
elements.continueBtn.addEventListener("click", continueGame);
elements.resetBtn.addEventListener("click", resetGame);
elements.rulesToggleBtn.addEventListener("click", toggleRules);
if (elements.audioToggleBtn) { // Add listener for audio toggle
    elements.audioToggleBtn.addEventListener("click", toggleAudio);
}

function toggleRules() {
    elements.rules.classList.toggle("hidden");
}

let player = {
    name: "Player",
    chips: 200,
    stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        getWinPercentage() {
            try {
                return this.gamesPlayed > 0 ? 
                    ((this.wins / this.gamesPlayed) * 100).toFixed(1) : "0.0";
            } catch (e) {
                console.error("Error calculating win percentage:", e);
                return "0.0";
            }
        }
    }
};

let dealer = {
    cards: [],
    sum: 0,
    hiddenCard: null,
    personalities: [
        "Hey there, hotshot! Ready to lose some chips?",
        "Welcome to my table, where I always win!",
        "Alright, rookie, let’s see what you’ve got!",
        "Step right up, I’m feeling generous today... or not!"
    ],
    getRandomComment(type) {
        const comments = {
            welcome: [
                "Take a seat, let’s dance with the cards!",
                "Fresh meat, huh? Let’s play!",
                "Welcome, pal! Hope you brought your lucky socks!"
            ],
            win: [
                "Beginner’s luck, eh? Won’t last long!",
                "You got me this time, you sneaky devil!",
                "Wow, you’re making me look bad here!"
            ],
            lose: [
                "Ha! Another victory for your friendly dealer!",
                "Better luck next time, champ!",
                "My cards are hotter than yours, huh?"
            ],
            blackjack: [
                "Blackjack?! You’re killing me here!",
                "21 on the dot? You’re a wizard!",
                "Perfect hand? I’m impressed... and annoyed!"
            ],
            bust: [
                "Boom! You went kaboom!",
                "Over 21? That’s my favorite number!",
                "Busted! Dealer’s still in the game!"
            ],
            tie: [
                "A tie? How boring!",
                "Push! We’re too evenly matched!",
                "Even steven, huh? Lame!"
            ],
            dealerBust: [
                "Oops! I overcooked it!",
                "Dealer down! You got lucky there!",
                "Bust! Guess I’m not perfect after all!"
            ]
        };
        try {
            return comments[type][Math.floor(Math.random() * comments[type].length)];
        } catch (e) {
            console.error("Error getting dealer comment:", e);
            return "Let's play!";
        }
    }
};

// Audio setup with enhanced management
const audio = {
    deal: null,
    shuffle: null,
    win: null,
    lose: null
};

let audioEnabled = true; // Flag to control audio playback

function loadAudio(src) {
    try {
        const sound = new Audio(src);
        sound.volume = 0.5;
        sound.onerror = () => {
            console.error(`Failed to load audio: ${src}`);
            sound.loadFailed = true; // Mark as failed for retry logic
        };
        return sound;
    } catch (e) {
        console.error(`Error creating audio for ${src}:`, e);
        return { play: () => {}, loadFailed: true }; // Silent fallback
    }
}

function initializeAudio() {
    audio.deal = loadAudio('sounds/deal.mp3');
    audio.shuffle = loadAudio('sounds/shuffle.mp3');
    audio.win = loadAudio('sounds/win.mp3');
    audio.lose = loadAudio('sounds/lose.mp3');
    updateAudioToggleUI();
}

function retryAudio() {
    try {
        Object.keys(audio).forEach(key => {
            if (audio[key].loadFailed) {
                audio[key] = loadAudio(`sounds/${key}.mp3`);
            }
        });
        audioEnabled = true;
        updateAudioToggleUI();
        elements.messageEl.textContent = "Audio retry attempted!";
        setTimeout(() => {
            elements.messageEl.textContent = dealer.getRandomComment("welcome");
        }, 1000);
    } catch (e) {
        console.error("Error retrying audio:", e);
        elements.messageEl.textContent = "Failed to retry audio.";
    }
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
        retryAudio(); // Retry loading if enabling audio
    } else {
        elements.messageEl.textContent = "Audio disabled.";
        setTimeout(() => {
            elements.messageEl.textContent = dealer.getRandomComment("welcome");
        }, 1000);
    }
    updateAudioToggleUI();
}

function updateAudioToggleUI() {
    if (elements.audioToggleBtn) {
        elements.audioToggleBtn.textContent = audioEnabled ? "Disable Audio" : "Enable Audio";
        elements.audioToggleBtn.classList.toggle("audio-off", !audioEnabled);
    }
}

// Deck management (Optimized)
let deck = [];

function createDeck(numDecks = 1) {
    try {
        deck = Array.from({ length: numDecks * 52 }, (_, i) => {
            const suit = Math.floor(i / 13) % 4; // 0: Spades, 1: Hearts, 2: Diamonds, 3: Clubs
            const value = (i % 13) + 1; // 1: Ace, 2-10, 11: J, 12: Q, 13: K
            const cardValue = value > 10 ? 10 : (value === 1 ? 11 : value);
            return { value: cardValue, face: value, suit };
        });
        shuffleDeck();
    } catch (e) {
        console.error("Error creating deck:", e);
        elements.messageEl.textContent = "Error initializing deck. Please reset the game.";
        deck = [];
    }
}

function shuffleDeck() {
    try {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        if (audioEnabled) {
            audio.shuffle.play().catch(() => {
                console.error("Error playing shuffle sound");
            });
        }
    } catch (e) {
        console.error("Error shuffling deck:", e);
        elements.messageEl.textContent = "Error shuffling deck. Please reset the game.";
    }
}

function drawCard() {
    try {
        if (!deck || deck.length === 0) {
            createDeck(1);
            elements.messageEl.textContent = "New deck initialized!";
            setTimeout(() => {
                elements.messageEl.textContent = dealer.getRandomComment("welcome");
            }, 1000);
        } else if (deck.length <= 10) {
            createDeck(1);
            elements.messageEl.textContent = "Deck reshuffled!";
            setTimeout(() => {
                elements.messageEl.textContent = dealer.getRandomComment("welcome");
            }, 1000);
        }
        const card = deck.pop();
        if (!card) throw new Error("No card drawn from deck");
        if (audioEnabled) {
            audio.deal.play().catch(() => console.error("Error playing deal sound"));
        }
        return card;
    } catch (e) {
        console.error("Error drawing card:", e);
        elements.messageEl.textContent = "Error drawing card. Please reset the game.";
        return null;
    }
}

// Initialize deck and audio
createDeck(1);
initializeAudio();

let cards = [];
let sum = 0;
let hasBlackJack = false;
let isAlive = false;
let gameInProgress = false;
let betAmount = 0;
let gameHistory = [];

try {
    if (!elements.playerEl || !elements.messageEl || !elements.statsEl) {
        throw new Error("UI elements not found");
    }
    elements.playerEl.textContent = player.name + ": $" + player.chips;
    elements.messageEl.textContent = dealer.personalities[Math.floor(Math.random() * dealer.personalities.length)];
    updateStats();
    if (elements.dealerAvatar) {
        elements.dealerAvatar.classList.add("waving");
        setTimeout(() => elements.dealerAvatar.classList.remove("waving"), 2000);
    }
} catch (e) {
    console.error("Error initializing UI:", e);
    if (elements.messageEl) elements.messageEl.textContent = "Error loading game. Please refresh the page.";
}

function getCardDisplay(card) {
    try {
        if (card === null) return "🂠";
        if (!card.hasOwnProperty("suit") || !card.hasOwnProperty("face")) {
            throw new Error("Invalid card object");
        }
        
        const suitsDisplay = ["♠", "♥", "♦", "♣"];
        const suit = suitsDisplay[card.suit];
        const color = (card.suit === 1 || card.suit === 2) ? "red" : "black";
        
        let faceValue;
        if (card.face === 11) faceValue = "J";
        else if (card.face === 12) faceValue = "Q";
        else if (card.face === 13) faceValue = "K";
        else if (card.face === 1) faceValue = "A";
        else faceValue = card.face;
        
        return { value: faceValue, suit: suit, color: color };
    } catch (e) {
        console.error("Error displaying card:", e);
        return { value: "?", suit: "?", color: "black" };
    }
}

function createCardElement(card, isHidden = false) {
    try {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        
        if (isHidden) {
            cardDiv.classList.add("card-back");
            return cardDiv;
        }
        
        const displayCard = getCardDisplay(card);
        cardDiv.className = `card ${displayCard.color}`;
        
        const topSuit = document.createElement("div");
        topSuit.className = "card-suit top";
        topSuit.textContent = displayCard.suit;
        
        const centerValue = document.createElement("div");
        centerValue.className = "card-value";
        centerValue.textContent = displayCard.value;
        
        const bottomSuit = document.createElement("div");
        bottomSuit.className = "card-suit bottom";
        bottomSuit.textContent = displayCard.suit;
        
        cardDiv.appendChild(topSuit);
        cardDiv.appendChild(centerValue);
        cardDiv.appendChild(bottomSuit); // Fixed typo from customSuit to bottomSuit
        
        return cardDiv;
    } catch (e) {
        console.error("Error creating card element:", e);
        const errorCard = document.createElement("div");
        errorCard.className = "card";
        errorCard.textContent = "Error";
        return errorCard;
    }
}

function triggerConfetti() {
    try {
        const confettiContainer = document.createElement("div");
        confettiContainer.className = "confetti-container";
        document.body.appendChild(confettiContainer);
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            confetti.style.left = Math.random() * 100 + "vw";
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.animationDuration = (Math.random() * 2 + 1) + "s";
            confettiContainer.appendChild(confetti);
        }
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
    } catch (e) {
        console.error("Error triggering confetti:", e);
    }
}

function placeBet() {
    try {
        if (gameInProgress) {
            elements.messageEl.textContent = "Game in progress! Finish this round first.";
            return;
        }
        
        const amount = parseInt(elements.betInput.value);
        if (isNaN(amount) || amount < 5 || amount % 5 !== 0) {
            elements.messageEl.textContent = "Please enter a valid bet amount (minimum $5, increments of 5).";
            return;
        }
        if (amount > player.chips) {
            elements.messageEl.textContent = `You don't have enough chips! You have $${player.chips}`;
            return;
        }
        
        betAmount = amount;
        elements.betEl.textContent = "Current Bet: $" + betAmount;
        elements.messageEl.textContent = dealer.getRandomComment("welcome");
        
        elements.dealerCardsDivEl.innerHTML = "";
        elements.dealerCardsEl.textContent = "Shuffling...";
        elements.dealerCardsEl.classList.add("shuffle-animation");
        elements.deckEl.classList.add("shuffle-animation");

        elements.cardsDivEl.innerHTML = "";
        elements.cardsEl.textContent = "Shuffling...";
        elements.cardsEl.classList.add("shuffle-animation");

        if (audioEnabled) {
            audio.shuffle.play().catch(e => console.error("Error playing shuffle sound:", e));
        }

        setTimeout(() => {
            try {
                elements.dealerCardsEl.classList.remove("shuffle-animation");
                elements.cardsEl.classList.remove("shuffle-animation");
                elements.deckEl.classList.remove("shuffle-animation");
                
                gameInProgress = true;
                isAlive = true;
                hasBlackJack = false;
                
                let firstCard = drawCard();
                let secondCard = drawCard();
                if (!firstCard || !secondCard) throw new Error("Failed to draw initial cards");
                cards = [firstCard, secondCard];
                sum = firstCard.value + secondCard.value;
                
                checkForAces();
                
                dealer.hiddenCard = drawCard();
                let dealerVisibleCard = drawCard();
                if (!dealer.hiddenCard || !dealerVisibleCard) throw new Error("Failed to draw dealer cards");
                dealer.cards = [dealer.hiddenCard, dealerVisibleCard];
                dealer.sum = dealer.hiddenCard.value + dealerVisibleCard.value;
                
                elements.betBtn.disabled = true;
                elements.hitBtn.disabled = false;
                elements.standBtn.disabled = false;
                elements.continueBtn.disabled = true;
                
                renderGame();
            } catch (e) {
                console.error("Error starting game:", e);
                elements.messageEl.textContent = "Error starting game. Please try again.";
                resetGameState();
            }
        }, 1000);
    } catch (e) {
        console.error("Error placing bet:", e);
        elements.messageEl.textContent = "Error placing bet. Please try again.";
    }
}

function continueGame() {
    try {
        if (gameInProgress) {
            elements.messageEl.textContent = "Cannot continue while game is in progress.";
            return;
        }
        
        elements.cardsDivEl.innerHTML = "";
        elements.dealerCardsDivEl.innerHTML = "";
        
        elements.dealerCardsEl.textContent = "Dealer Cards:";
        elements.cardsEl.textContent = "Your Cards:";
        
        cards = [];
        sum = 0;
        dealer.cards = [];
        dealer.sum = 0;
        hasBlackJack = false;
        betAmount = 0;
        
        elements.messageEl.textContent = dealer.getRandomComment("welcome");
        elements.betEl.textContent = "Current Bet: $0";
        elements.betBtn.disabled = false;
        elements.hitBtn.disabled = true;
        elements.standBtn.disabled = true;
        elements.continueBtn.disabled = true;
        
        elements.sumEl.textContent = "Your Sum:";
        elements.dealerSumEl.textContent = "Dealer Sum:";
    } catch (e) {
        console.error("Error continuing game:", e);
        elements.messageEl.textContent = "Error continuing game. Please reset.";
    }
}

function renderGame(isDealerHit = false) {
    try {
        elements.cardsDivEl.innerHTML = "";
        elements.dealerCardsDivEl.innerHTML = "";
        
        elements.cardsEl.textContent = "Your Cards:";
        cards.forEach((card, index) => {
            const cardElem = createCardElement(card);
            elements.cardsDivEl.appendChild(cardElem);
            setTimeout(() => {
                cardElem.classList.add("new-card");
                setTimeout(() => cardElem.classList.remove("new-card"), 500);
            }, index * 100);
        });
        
        elements.dealerCardsEl.textContent = "Dealer Cards:";
        if (gameInProgress && !hasBlackJack) {
            const hiddenCardElem = createCardElement(null, true);
            elements.dealerCardsDivEl.appendChild(hiddenCardElem);
            const visibleCardElem = createCardElement(dealer.cards[1]);
            elements.dealerCardsDivEl.appendChild(visibleCardElem);
            setTimeout(() => {
                visibleCardElem.classList.add("new-card");
                setTimeout(() => visibleCardElem.classList.remove("new-card"), 500);
            }, 100);
            elements.dealerSumEl.textContent = "Dealer Sum: ?";
            if (elements.dealerAvatar) {
                elements.dealerAvatar.classList.add("dealing");
                setTimeout(() => elements.dealerAvatar.classList.remove("dealing"), 500);
            }
        } else {
            dealer.cards.forEach((card, index) => {
                const cardElem = createCardElement(card);
                elements.dealerCardsDivEl.appendChild(cardElem);
                if (isDealerHit && index === dealer.cards.length - 1) {
                    setTimeout(() => {
                        cardElem.classList.add("new-card");
                        if (elements.dealerAvatar) {
                            elements.dealerAvatar.classList.add("dealing");
                            setTimeout(() => elements.dealerAvatar.classList.remove("dealing"), 500);
                        }
                        setTimeout(() => cardElem.classList.remove("new-card"), 500);
                    }, index * 100);
                } else {
                    setTimeout(() => {
                        cardElem.classList.add("new-card");
                        setTimeout(() => cardElem.classList.remove("new-card"), 500);
                    }, index * 100);
                }
            });
            elements.dealerSumEl.textContent = "Dealer Sum: " + dealer.sum;
        }
        
        elements.sumEl.textContent = "Your Sum: " + sum;
        
        if (sum < 21) {
            elements.messageEl.textContent = "Do you want to draw a new card?";
        } else if (sum === 21) {
            if (cards.length === 2) {
                elements.messageEl.textContent = dealer.getRandomComment("blackjack");
                hasBlackJack = true;
                const playerCards = document.querySelectorAll('#cards-div .card');
                playerCards.forEach((card, index) => {
                    card.style.animation = `standEffect 0.5s ease-out ${index * 0.1}s, pulse 1s ease-in-out ${index * 0.1 + 0.5}s 2`;
                });
                endGame(true, 1.5);
            } else {
                elements.messageEl.textContent = "You've got 21!";
                stand();
            }
        } else {
            elements.messageEl.textContent = dealer.getRandomComment("bust");
            isAlive = false;
            endGame(false);
        }
    } catch (e) {
        console.error("Error rendering game:", e);
        elements.messageEl.textContent = "Error rendering game state.";
    }
}

function checkForAces() {
    try {
        let numAces = 0;
        let totalSum = 0;
        
        for (let i = 0; i < cards.length; i++) {
            if (!cards[i]) {
                console.error(`Invalid card at index ${i}: Card is null or undefined`);
                elements.messageEl.textContent = "Error in card hand detected. Please reset the game.";
                sum = 0;
                return;
            }
            if (!cards[i].hasOwnProperty("face") || !cards[i].hasOwnProperty("value")) {
                throw new Error("Invalid card in hand at index " + i);
            }
            if (cards[i].face === 1) numAces++;
            totalSum += cards[i].value;
        }
        
        while (totalSum > 21 && numAces > 0) {
            totalSum -= 10;
            numAces--;
        }
        
        sum = totalSum;
    } catch (e) {
        console.error("Error checking aces:", e);
        elements.messageEl.textContent = "Error calculating hand value.";
        sum = 0;
    }
}

function newCard() {
    try {
        if (!isAlive || hasBlackJack) {
            elements.messageEl.textContent = "Cannot hit now. Please continue or start a new game.";
            return;
        }
        
        let card = drawCard();
        if (!card) throw new Error("No card drawn");
        sum += card.value;
        cards.push(card);
        
        checkForAces();
        renderGame();
    } catch (e) {
        console.error("Error drawing new card:", e);
        elements.messageEl.textContent = "Error drawing card.";
    }
}

function stand() {
    try {
        if (!isAlive || !gameInProgress || window.dealerPlaying) {
            elements.messageEl.textContent = "Cannot stand now. Please start a new game or wait for dealer.";
            return;
        }
        
        const playerCards = document.querySelectorAll('#cards-div .card');
        playerCards.forEach(card => card.classList.add('stand-effect'));
        
        setTimeout(() => {
            try {
                gameInProgress = false;
                const hiddenCard = document.querySelector('#dealer-cards-div .card-back');
                if (hiddenCard) {
                    hiddenCard.classList.add('reveal');
                    setTimeout(() => {
                        hiddenCard.remove();
                        const revealedCard = createCardElement(dealer.hiddenCard);
                        elements.dealerCardsDivEl.insertBefore(revealedCard, elements.dealerCardsDivEl.firstChild);
                        playDealerHand();
                    }, 250);
                } else {
                    playDealerHand();
                }
            } catch (e) {
                console.error("Error revealing dealer card:", e);
                elements.messageEl.textContent = "Error in dealer turn.";
            }
        }, 500);
    } catch (e) {
        console.error("Error standing:", e);
        elements.messageEl.textContent = "Error ending turn.";
    }
}

function playDealerHand() {
    try {
        if (window.dealerPlaying) {
            console.log("Dealer is already playing, aborting new attempt.");
            return;
        }
        window.dealerPlaying = true;

        if (window.dealerTimeout) {
            clearTimeout(window.dealerTimeout);
        }

        const drawNextCard = () => {
            if (!gameInProgress || !isAlive || dealer.cards.length >= 5) {
                console.log(`Stopping dealer: gameInProgress=${gameInProgress}, isAlive=${isAlive}, cards=${dealer.cards.length}`);
                determineWinner();
                window.dealerPlaying = false;
                return;
            }

            if (dealer.sum < 17) {
                let newDealerCard = drawCard();
                if (!newDealerCard) {
                    elements.messageEl.textContent = "Error drawing dealer card.";
                    endGame(false);
                    window.dealerPlaying = false;
                    return;
                }
                dealer.cards.push(newDealerCard);
                dealer.sum += newDealerCard.value;

                let dealerAces = dealer.cards.filter(card => card.face === 1).length;
                while (dealer.sum > 21 && dealerAces > 0) {
                    dealer.sum -= 10;
                    dealerAces--;
                }

                console.log(`Dealer drew a card. Total cards: ${dealer.cards.length}, Sum: ${dealer.sum}`);

                renderGame(true);

                if (dealer.sum < 17 && dealer.cards.length < 5) {
                    window.dealerTimeout = setTimeout(drawNextCard, 500);
                } else {
                    determineWinner();
                    window.dealerPlaying = false;
                }
            } else {
                determineWinner();
                window.dealerPlaying = false;
            }
        };

        console.log("Starting dealer turn. Initial cards:", dealer.cards.length, "Sum:", dealer.sum);
        drawNextCard();
    } catch (e) {
        console.error("Error in dealer play:", e);
        elements.messageEl.textContent = "Error in dealer's turn.";
        endGame(false);
        window.dealerPlaying = false;
    }
}

function determineWinner() {
    try {
        renderGame();
        
        if (dealer.sum > 21) {
            elements.messageEl.textContent = dealer.getRandomComment("dealerBust");
            endGame(true);
        } else if (dealer.sum > sum) {
            elements.messageEl.textContent = dealer.getRandomComment("lose");
            endGame(false);
        } else if (dealer.sum < sum) {
            elements.messageEl.textContent = dealer.getRandomComment("win");
            endGame(true);
        } else {
            elements.messageEl.textContent = dealer.getRandomComment("tie");
            endGame(null);
        }
    } catch (e) {
        console.error("Error determining winner:", e);
        elements.messageEl.textContent = "Error determining winner.";
    }
}

function endGame(playerWins, multiplier = 1) {
    try {
        gameInProgress = false;
        elements.betBtn.disabled = false;
        elements.hitBtn.disabled = true;
        elements.standBtn.disabled = true;
        elements.continueBtn.disabled = false;
        
        let result = "";
        let winAmount = 0;
        
        player.stats.gamesPlayed++;
        if (playerWins === true) {
            winAmount = Math.floor(betAmount * multiplier);
            player.chips += winAmount;
            result = "win";
            player.stats.wins++;
            if (audioEnabled) audio.win.play().catch(e => console.error("Error playing win sound:", e));
            triggerConfetti();
        } else if (playerWins === false) {
            player.chips -= betAmount;
            winAmount = -betAmount;
            result = "lose";
            player.stats.losses++;
            if (audioEnabled) audio.lose.play().catch(e => console.error("Error playing lose sound:", e));
        } else {
            result = "tie";
            player.stats.ties++;
        }
        
        gameHistory.push({
            bet: betAmount,
            result: result,
            winAmount: winAmount,
            playerSum: sum,
            dealerSum: dealer.sum
        });
        
        updateHistory();
        updateStats();
        
        elements.playerEl.textContent = player.name + ": $" + player.chips;
        
        if (player.chips <= 0) {
            elements.messageEl.textContent += " Game over! You're out of chips!";
            elements.betBtn.disabled = true;
            elements.continueBtn.disabled = true;
            elements.resetBtn.classList.add("highlight-button");
        }
    } catch (e) {
        console.error("Error ending game:", e);
        elements.messageEl.textContent = "Error settling game. Please reset.";
    }
}

function updateHistory() {
    try {
        elements.historyEl.innerHTML = "";
        const startIndex = Math.max(0, gameHistory.length - 5);
        
        for (let i = startIndex; i < gameHistory.length; i++) {
            const game = gameHistory[i];
            const gameItem = document.createElement("div");
            gameItem.className = `history-item ${game.result}`;
            
            let resultText = "";
            if (game.result === "win") {
                resultText = `Won $${game.winAmount}`;
            } else if (game.result === "lose") {
                resultText = `Lost $${Math.abs(game.winAmount)}`;
            } else {
                resultText = "Push (Tie)";
            }
            
            gameItem.innerHTML = `
                <span>Bet: $${game.bet}</span>
                <span>${resultText}</span>
                <span>You: ${game.playerSum} | Dealer: ${game.dealerSum}</span>
            `;
            elements.historyEl.appendChild(gameItem);
        }
    } catch (e) {
        console.error("Error updating history:", e);
        elements.historyEl.innerHTML = "<div>Error displaying history.</div>";
    }
}

function updateStats() {
    try {
        elements.statsEl.innerHTML = `
            Games: ${player.stats.gamesPlayed} | 
            Wins: ${player.stats.wins} | 
            Losses: ${player.stats.losses} | 
            Ties: ${player.stats.ties} | 
            Win %: ${player.stats.getWinPercentage()}%
        `;
    } catch (e) {
        console.error("Error updating stats:", e);
        elements.statsEl.innerHTML = "Error displaying stats.";
    }
}

function resetGame() {
    try {
        player.chips = 200;
        player.stats.gamesPlayed = 0;
        player.stats.wins = 0;
        player.stats.losses = 0;
        player.stats.ties = 0;
        elements.playerEl.textContent = player.name + ": $" + player.chips;
        gameInProgress = false;
        betAmount = 0;
        elements.betEl.textContent = "Current Bet: $0";
        elements.messageEl.textContent = dealer.personalities[Math.floor(Math.random() * dealer.personalities.length)];
        elements.cardsEl.textContent = "Your Cards:";
        elements.sumEl.textContent = "Your Sum:";
        elements.dealerCardsEl.textContent = "Dealer Cards:";
        elements.dealerSumEl.textContent = "Dealer Sum:";
        
        elements.cardsDivEl.innerHTML = "";
        elements.dealerCardsDivEl.innerHTML = "";
        
        createDeck(1);
        audioEnabled = true; // Reset audio state
        initializeAudio();   // Re-initialize audio
        
        gameHistory = [];
        updateHistory();
        updateStats();
        
        elements.betBtn.disabled = false;
        elements.hitBtn.disabled = true;
        elements.standBtn.disabled = true;
        elements.continueBtn.disabled = true;
        elements.resetBtn.classList.remove("highlight-button");

        if (elements.dealerAvatar) {
            elements.dealerAvatar.classList.add("waving");
            setTimeout(() => elements.dealerAvatar.classList.remove("waving"), 2000);
        }
    } catch (e) {
        console.error("Error resetting game:", e);
        elements.messageEl.textContent = "Error resetting game. Please refresh the page.";
    }
}

function resetGameState() {
    gameInProgress = false;
    isAlive = false;
    hasBlackJack = false;
    cards = [];
    sum = 0;
    dealer.cards = [];
    dealer.sum = 0;
    dealer.hiddenCard = null;
    elements.betBtn.disabled = false;
    elements.hitBtn.disabled = true;
    elements.standBtn.disabled = true;
    elements.continueBtn.disabled = true;
}