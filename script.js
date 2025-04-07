// index.js - Blackjack Game with Animated Dealer Avatar

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
}

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
        }
        try {
            return comments[type][Math.floor(Math.random() * comments[type].length)];
        } catch (e) {
            console.error("Error getting dealer comment:", e);
            return "Let's play!";
        }
    }
}

// Audio setup
const audio = {
    deal: new Audio('sounds/deal.mp3'),
    shuffle: new Audio('sounds/shuffle.mp3'),
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3')
};

for (let sound in audio) {
    audio[sound].volume = 0.5;
}

// Deck management
let deck = [];
const suits = [0, 1, 2, 3]; // 0: Spades, 1: Hearts, 2: Diamonds, 3: Clubs
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // 1: Ace, 11: J, 12: Q, 13: K

function createDeck(numDecks = 1) {
    try {
        deck = [];
        if (!Number.isInteger(numDecks) || numDecks < 1) {
            throw new Error("Invalid number of decks");
        }
        for (let d = 0; d < numDecks; d++) {
            for (let suit of suits) {
                for (let value of values) {
                    let cardValue = value > 10 ? 10 : (value === 1 ? 11 : value);
                    deck.push({ value: cardValue, face: value, suit: suit });
                }
            }
        }
        shuffleDeck();
    } catch (e) {
        console.error("Error creating deck:", e);
        messageEl.textContent = "Error initializing deck. Please reset the game.";
        deck = [];
    }
}

function shuffleDeck() {
    try {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        audio.shuffle.play().catch(e => console.error("Error playing shuffle sound:", e));
    } catch (e) {
        console.error("Error shuffling deck:", e);
        messageEl.textContent = "Error shuffling deck. Please reset the game.";
    }
}

function drawCard() {
    try {
        if (!deck || deck.length === 0) {
            createDeck(1);
            messageEl.textContent = "New deck initialized!";
            setTimeout(() => {
                messageEl.textContent = dealer.getRandomComment("welcome");
            }, 1000);
        } else if (deck.length <= 10) {
            createDeck(1);
            messageEl.textContent = "Deck reshuffled!";
            setTimeout(() => {
                messageEl.textContent = dealer.getRandomComment("welcome");
            }, 1000);
        }
        const card = deck.pop();
        if (!card) throw new Error("No card drawn from deck");
        audio.deal.play().catch(e => console.error("Error playing deal sound:", e));
        const dealerAvatar = document.getElementById("dealer-avatar");
        if (dealerAvatar) {
            dealerAvatar.classList.add("dealing");
            setTimeout(() => dealerAvatar.classList.remove("dealing"), 500);
        }
        return card;
    } catch (e) {
        console.error("Error drawing card:", e);
        messageEl.textContent = "Error drawing card. Please reset the game.";
        return null;
    }
}

// Initialize deck
createDeck(1);

let cards = [];
let sum = 0;
let hasBlackJack = false;
let isAlive = false;
let gameInProgress = false;
let message = "";
let betAmount = 0;
let gameHistory = [];
let messageEl = document.getElementById("message-el");
let sumEl = document.getElementById("sum-el");
let cardsEl = document.getElementById("cards-el");
let playerEl = document.getElementById("player-el");
let dealerCardsEl = document.getElementById("dealer-cards-el");
let dealerSumEl = document.getElementById("dealer-sum-el");
let betEl = document.getElementById("bet-el");
let cardsDivEl = document.getElementById("cards-div");
let dealerCardsDivEl = document.getElementById("dealer-cards-div");
let historyEl = document.getElementById("history-el");
let deckEl = document.getElementById("deck");
let statsEl = document.getElementById("stats-el");

// Initialize player display and dealer avatar
try {
    if (!playerEl || !messageEl || !statsEl) {
        throw new Error("UI elements not found");
    }
    playerEl.textContent = player.name + ": $" + player.chips;
    messageEl.textContent = dealer.personalities[Math.floor(Math.random() * dealer.personalities.length)];
    updateStats();
    const dealerAvatar = document.getElementById("dealer-avatar");
    if (dealerAvatar) {
        dealerAvatar.classList.add("waving");
        setTimeout(() => dealerAvatar.classList.remove("waving"), 2000);
    }
} catch (e) {
    console.error("Error initializing UI:", e);
    if (messageEl) messageEl.textContent = "Error loading game. Please refresh the page.";
}

// Convert card to visual representation
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

// Create visual card element
function createCardElement(card, isHidden = false) {
    try {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        
        if (isHidden) {
            cardDiv.classList.add("card-back");
            return cardDiv;
        }
        
        const displayCard = getCardDisplay(card);
        cardDiv.className = `card ${displayCard.color} new-card`;
        
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
        cardDiv.appendChild(bottomSuit);
        
        return cardDiv;
    } catch (e) {
        console.error("Error creating card element:", e);
        const errorCard = document.createElement("div");
        errorCard.className = "card";
        errorCard.textContent = "Error";
        return errorCard;
    }
}

// Trigger confetti effect
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

// Place a bet and start game
function placeBet() {
    try {
        if (gameInProgress) {
            messageEl.textContent = "Game in progress! Finish this round first.";
            return;
        }
        
        const betInput = document.getElementById("bet-input");
        if (!betInput) throw new Error("Bet input not found");
        
        const amount = parseInt(betInput.value);
        if (isNaN(amount) || amount <= 0) {
            messageEl.textContent = "Please enter a valid bet amount (greater than 0).";
            return;
        }
        if (amount > player.chips) {
            messageEl.textContent = `You don't have enough chips! You have $${player.chips}`;
            return;
        }
        
        betAmount = amount;
        betEl.textContent = "Current Bet: $" + betAmount;
        messageEl.textContent = dealer.getRandomComment("welcome");
        
        dealerCardsDivEl.innerHTML = "";
        dealerCardsEl.textContent = "Shuffling...";
        dealerCardsEl.classList.add("shuffle-animation");
        deckEl.classList.add("shuffle-animation");

        cardsDivEl.innerHTML = "";
        cardsEl.textContent = "Shuffling...";
        cardsEl.classList.add("shuffle-animation");

        audio.shuffle.play().catch(e => console.error("Error playing shuffle sound:", e));

        setTimeout(() => {
            try {
                dealerCardsEl.classList.remove("shuffle-animation");
                cardsEl.classList.remove("shuffle-animation");
                deckEl.classList.remove("shuffle-animation");
                
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
                
                document.getElementById("bet-btn").disabled = true;
                document.getElementById("hit-btn").disabled = false;
                document.getElementById("stand-btn").disabled = false;
                document.getElementById("continue-btn").disabled = true;
                
                renderGame();
            } catch (e) {
                console.error("Error starting game:", e);
                messageEl.textContent = "Error starting game. Please try again.";
                resetGameState();
            }
        }, 1000);
    } catch (e) {
        console.error("Error placing bet:", e);
        messageEl.textContent = "Error placing bet. Please try again.";
    }
}

// Continue game with current chip stack
function continueGame() {
    try {
        if (gameInProgress) {
            messageEl.textContent = "Cannot continue while game is in progress.";
            return;
        }
        
        cardsDivEl.innerHTML = "";
        dealerCardsDivEl.innerHTML = "";
        
        dealerCardsEl.textContent = "Dealer Cards:";
        cardsEl.textContent = "Your Cards:";
        
        cards = [];
        sum = 0;
        dealer.cards = [];
        dealer.sum = 0;
        hasBlackJack = false;
        betAmount = 0;
        
        messageEl.textContent = dealer.getRandomComment("welcome");
        betEl.textContent = "Current Bet: $0";
        document.getElementById("bet-btn").disabled = false;
        document.getElementById("hit-btn").disabled = true;
        document.getElementById("stand-btn").disabled = true;
        document.getElementById("continue-btn").disabled = true;
        
        sumEl.textContent = "Your Sum:";
        dealerSumEl.textContent = "Dealer Sum:";
    } catch (e) {
        console.error("Error continuing game:", e);
        messageEl.textContent = "Error continuing game. Please reset.";
    }
}

// Render game state
function renderGame(isDealerHit = false) {
    try {
        cardsDivEl.innerHTML = "";
        dealerCardsDivEl.innerHTML = "";
        
        cardsEl.textContent = "Your Cards:";
        cards.forEach((card, index) => {
            setTimeout(() => {
                const cardElem = createCardElement(card);
                cardsDivEl.appendChild(cardElem);
            }, index * 100);
        });
        
        dealerCardsEl.textContent = "Dealer Cards:";
        if (gameInProgress && !hasBlackJack) {
            const hiddenCardElem = createCardElement(null, true);
            dealerCardsDivEl.appendChild(hiddenCardElem);
            const visibleCardElem = createCardElement(dealer.cards[1]);
            dealerCardsDivEl.appendChild(visibleCardElem);
            dealerSumEl.textContent = "Dealer Sum: ?";
        } else {
            dealer.cards.forEach((card, index) => {
                setTimeout(() => {
                    const cardElem = createCardElement(card);
                    if (isDealerHit && index === dealer.cards.length - 1) {
                        cardElem.classList.add('new-card');
                    }
                    dealerCardsDivEl.appendChild(cardElem);
                }, index * 100);
            });
            dealerSumEl.textContent = "Dealer Sum: " + dealer.sum;
        }
        
        sumEl.textContent = "Your Sum: " + sum;
        
        if (sum < 21) {
            message = "Do you want to draw a new card?";
        } else if (sum === 21) {
            if (cards.length === 2) {
                message = dealer.getRandomComment("blackjack");
                hasBlackJack = true;
                const playerCards = document.querySelectorAll('#cards-div .card');
                playerCards.forEach((card, index) => {
                    card.style.animation = `standEffect 0.5s ease-out ${index * 0.1}s, pulse 1s ease-in-out ${index * 0.1 + 0.5}s 2`;
                });
                endGame(true, 1.5);
            } else {
                message = "You've got 21!";
                stand();
            }
        } else {
            message = dealer.getRandomComment("bust");
            isAlive = false;
            endGame(false);
        }
        
        messageEl.textContent = message;
    } catch (e) {
        console.error("Error rendering game:", e);
        messageEl.textContent = "Error rendering game state.";
    }
}

// Check for Aces and adjust value if necessary
function checkForAces() {
    try {
        let numAces = 0;
        let totalSum = 0;
        
        for (let i = 0; i < cards.length; i++) {
            if (!cards[i]) throw new Error("Invalid card in hand");
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
        messageEl.textContent = "Error calculating hand value.";
        sum = 0;
    }
}

// Hit - draw a new card
function newCard() {
    try {
        if (!isAlive || hasBlackJack) {
            messageEl.textContent = "Cannot hit now. Please continue or start a new game.";
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
        messageEl.textContent = "Error drawing card.";
    }
}

// Stand - end player's turn and play dealer's hand
function stand() {
    try {
        if (!isAlive || !gameInProgress) {
            messageEl.textContent = "Cannot stand now. Please start a new game.";
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
                        dealerCardsDivEl.insertBefore(revealedCard, dealerCardsDivEl.firstChild);
                        playDealerHand();
                    }, 250);
                } else {
                    playDealerHand();
                }
            } catch (e) {
                console.error("Error revealing dealer card:", e);
                messageEl.textContent = "Error in dealer turn.";
            }
        }, 500);
    } catch (e) {
        console.error("Error standing:", e);
        messageEl.textContent = "Error ending turn.";
    }
}

// Handle dealer's turn
function playDealerHand() {
    const dealerPlay = () => {
        try {
            if (dealer.sum < 17) {
                let newDealerCard = drawCard();
                if (!newDealerCard) throw new Error("Failed to draw dealer card");
                dealer.cards.push(newDealerCard);
                dealer.sum += newDealerCard.value;
                
                let dealerAces = 0;
                for (let i = 0; i < dealer.cards.length; i++) {
                    if (dealer.cards[i].face === 1) dealerAces++;
                }
                
                while (dealer.sum > 21 && dealerAces > 0) {
                    dealer.sum -= 10;
                    dealerAces--;
                }
                
                renderGame(true);
                setTimeout(dealerPlay, 500);
            } else {
                determineWinner();
            }
        } catch (e) {
            console.error("Error in dealer play:", e);
            messageEl.textContent = "Error in dealer's turn.";
            endGame(false);
        }
    };
    
    dealerPlay();
}

// Determine the winner
function determineWinner() {
    try {
        renderGame();
        
        if (dealer.sum > 21) {
            message = dealer.getRandomComment("dealerBust");
            endGame(true);
        } else if (dealer.sum > sum) {
            message = dealer.getRandomComment("lose");
            endGame(false);
        } else if (dealer.sum < sum) {
            message = dealer.getRandomComment("win");
            endGame(true);
        } else {
            message = dealer.getRandomComment("tie");
            endGame(null);
        }
        
        messageEl.textContent = message;
    } catch (e) {
        console.error("Error determining winner:", e);
        messageEl.textContent = "Error determining winner.";
    }
}

// End game and settle bets
function endGame(playerWins, multiplier = 1) {
    try {
        gameInProgress = false;
        document.getElementById("bet-btn").disabled = false;
        document.getElementById("hit-btn").disabled = true;
        document.getElementById("stand-btn").disabled = true;
        document.getElementById("continue-btn").disabled = false;
        
        let result = "";
        let winAmount = 0;
        
        player.stats.gamesPlayed++;
        if (playerWins === true) {
            winAmount = Math.floor(betAmount * multiplier);
            player.chips += winAmount;
            result = "win";
            player.stats.wins++;
            audio.win.play().catch(e => console.error("Error playing win sound:", e));
            triggerConfetti();
        } else if (playerWins === false) {
            player.chips -= betAmount;
            winAmount = -betAmount;
            result = "lose";
            player.stats.losses++;
            audio.lose.play().catch(e => console.error("Error playing lose sound:", e));
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
        
        playerEl.textContent = player.name + ": $" + player.chips;
        
        if (player.chips <= 0) {
            messageEl.textContent += " Game over! You're out of chips!";
            document.getElementById("bet-btn").disabled = true;
            document.getElementById("continue-btn").disabled = true;
            document.getElementById("reset-btn").classList.add("highlight-button");
        }
    } catch (e) {
        console.error("Error ending game:", e);
        messageEl.textContent = "Error settling game. Please reset.";
    }
}

// Update game history display
function updateHistory() {
    try {
        historyEl.innerHTML = "";
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
            historyEl.appendChild(gameItem);
        }
    } catch (e) {
        console.error("Error updating history:", e);
        historyEl.innerHTML = "<div>Error displaying history.</div>";
    }
}

// Update stats display
function updateStats() {
    try {
        statsEl.innerHTML = `
            Games: ${player.stats.gamesPlayed} | 
            Wins: ${player.stats.wins} | 
            Losses: ${player.stats.losses} | 
            Ties: ${player.stats.ties} | 
            Win %: ${player.stats.getWinPercentage()}%
        `;
    } catch (e) {
        console.error("Error updating stats:", e);
        statsEl.innerHTML = "Error displaying stats.";
    }
}

// Reset game with new chip amount
function resetGame() {
    try {
        player.chips = 200;
        player.stats.gamesPlayed = 0;
        player.stats.wins = 0;
        player.stats.losses = 0;
        player.stats.ties = 0;
        playerEl.textContent = player.name + ": $" + player.chips;
        gameInProgress = false;
        betAmount = 0;
        betEl.textContent = "Current Bet: $0";
        messageEl.textContent = dealer.personalities[Math.floor(Math.random() * dealer.personalities.length)];
        cardsEl.textContent = "Your Cards:";
        sumEl.textContent = "Your Sum:";
        dealerCardsEl.textContent = "Dealer Cards:";
        dealerSumEl.textContent = "Dealer Sum:";
        
        cardsDivEl.innerHTML = "";
        dealerCardsDivEl.innerHTML = "";
        
        createDeck(1);
        
        gameHistory = [];
        updateHistory();
        updateStats();
        
        document.getElementById("bet-btn").disabled = false;
        document.getElementById("hit-btn").disabled = true;
        document.getElementById("stand-btn").disabled = true;
        document.getElementById("continue-btn").disabled = true;
        document.getElementById("reset-btn").classList.remove("highlight-button");

        const dealerAvatar = document.getElementById("dealer-avatar");
        if (dealerAvatar) {
            dealerAvatar.classList.add("waving");
            setTimeout(() => dealerAvatar.classList.remove("waving"), 2000);
        }
    } catch (e) {
        console.error("Error resetting game:", e);
        messageEl.textContent = "Error resetting game. Please refresh the page.";
    }
}

// Helper function to reset game state on critical errors
function resetGameState() {
    gameInProgress = false;
    isAlive = false;
    hasBlackJack = false;
    cards = [];
    sum = 0;
    dealer.cards = [];
    dealer.sum = 0;
    dealer.hiddenCard = null;
    document.getElementById("bet-btn").disabled = false;
    document.getElementById("hit-btn").disabled = true;
    document.getElementById("stand-btn").disabled = true;
    document.getElementById("continue-btn").disabled = true;
}