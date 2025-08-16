// Game state variables
let eggs = 0;
let eggsPerClick = 1;
let eggsPerSecond = 0;
let goldenFeathers = 0;
let bestEggs = 0;
let lastSaveTime = Date.now();
let gameInitialized = false;

// Producer data structure
const producers = [
    { name: "Backyard Hen", baseCost: 10, baseEps: 0.1, count: 0 },
    { name: "Coop Rooster", baseCost: 100, baseEps: 1, count: 0 },
    { name: "Farmhand", baseCost: 1000, baseEps: 8, count: 0 },
    { name: "Incubator", baseCost: 10000, baseEps: 47, count: 0 },
    { name: "Hatchery", baseCost: 100000, baseEps: 300, count: 0 },
    { name: "Tractor", baseCost: 1000000, baseEps: 1500, count: 0 },
    { name: "Lab", baseCost: 10000000, baseEps: 8000, count: 0 },
    { name: "AI Roost", baseCost: 100000000, baseEps: 50000, count: 0 },
    { name: "Cosmic Nest", baseCost: 1000000000, baseEps: 200000, count: 0 }
];

// Zone data structure
const zones = [
    { name: "Backyard Coop", milestone: 0, class: "zone-bg-backyard" },
    { name: "County Farm", milestone: 1000, class: "zone-bg-farm" },
    { name: "Industrial Barn", milestone: 50000, class: "zone-bg-barn" },
    { name: "Sky Roost", milestone: 1000000, class: "zone-bg-roost" },
    { name: "Moon Coop", milestone: 50000000, class: "zone-bg-moon" },
    { name: "Cosmic Nest", milestone: 1000000000, class: "zone-bg-cosmic" },
    { name: "Phoenix Aviary", milestone: 50000000000, class: "zone-bg-phoenix" }
];

// Constants
const COST_MULTIPLIER = 1.15;
const PRESTIGE_MILESTONE = 1000000000; // 1 billion
const FEATHER_BONUS = 0.10; // +10% to EPC & EPS
const OFFLINE_CAP = 8 * 60 * 60; // 8 hours in seconds

// DOM elements
const eggsDisplay = document.getElementById('eggs-display');
const epsDisplay = document.getElementById('eps-display');
const epcDisplay = document.getElementById('epc-display');
const chickenButton = document.getElementById('chicken-button');
const producersContainer = document.getElementById('producers-container');
const currentZoneDisplay = document.getElementById('current-zone');
const nextZoneDisplay = document.getElementById('next-zone');
const nextZoneMilestoneDisplay = document.getElementById('next-zone-milestone');
const prestigeInfo = document.getElementById('prestige-info');
const featherCountDisplay = document.getElementById('feather-count');
const featherMultiplierDisplay = document.getElementById('feather-multiplier');
const prestigeButton = document.getElementById('prestige-button');
const messageBox = document.getElementById('message-box');

/**
 * Formats a number with commas and suffixes for readability.
 * @param {number} num The number to format.
 * @returns {string} The formatted number string.
 */
function formatNumber(num) {
    const si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "K" },
        { value: 1E6, symbol: "M" },
        { value: 1E9, symbol: "B" },
        { value: 1E12, symbol: "T" },
        { value: 1E15, symbol: "Q" },
        { value: 1E18, symbol: "S" },
        { value: 1E21, symbol: "O" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(2).replace(rx, "$1") + si[i].symbol;
}

/**
 * Displays a temporary message to the user.
 * @param {string} message The message to show.
 */
function showMessage(message) {
    messageBox.textContent = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 2000);
}

/**
 * Updates all the displayed values on the page.
 */
function updateDisplay() {
    // Calculate total EPS and EPC with feather bonus
    const featherBonus = goldenFeathers * FEATHER_BONUS;
    const totalEps = eggsPerSecond * (1 + featherBonus);
    const totalEpc = eggsPerClick * (1 + featherBonus);

    // Update stats displays
    eggsDisplay.textContent = formatNumber(eggs);
    epsDisplay.textContent = formatNumber(totalEps);
    epcDisplay.textContent = formatNumber(totalEpc);
    
    // Pulse the eggs display for visual feedback
    eggsDisplay.classList.add('pulse');
    setTimeout(() => { eggsDisplay.classList.remove('pulse'); }, 500);

    // Update producer buttons
    producers.forEach((producer, index) => {
        const button = document.getElementById(`buy-button-${index}`);
        if (button) {
            button.disabled = eggs < producer.currentCost;
        }
    });

    // Update prestige display
    prestigeButton.disabled = eggs < PRESTIGE_MILESTONE;
    const feathersToEarn = Math.floor(Math.sqrt(bestEggs / PRESTIGE_MILESTONE));
    prestigeInfo.textContent = `Reach ${formatNumber(PRESTIGE_MILESTONE)} total eggs to prestige and earn ${feathersToEarn} Golden Feathers!`;
    featherCountDisplay.textContent = goldenFeathers;
    featherMultiplierDisplay.textContent = (featherBonus * 100).toFixed(0);

    // Update zone display
    unlockZones();
}

/**
 * Handles the main chicken button click.
 */
function tapChicken() {
    const featherBonus = goldenFeathers * FEATHER_BONUS;
    const totalEpc = eggsPerClick * (1 + featherBonus);
    eggs += totalEpc;
    bestEggs = Math.max(bestEggs, eggs); // Track the best eggs for prestige

    // Create a floating egg for visual feedback
    const floatingEgg = document.createElement('div');
    floatingEgg.textContent = `+${formatNumber(totalEpc)}`;
    floatingEgg.classList.add('floating-egg');
    const buttonRect = chickenButton.getBoundingClientRect();
    floatingEgg.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
    floatingEgg.style.top = `${buttonRect.top + buttonRect.height / 2}px`;
    document.body.appendChild(floatingEgg);
    setTimeout(() => {
        document.body.removeChild(floatingEgg);
    }, 1000);

    updateDisplay();
}

/**
 * Buys a producer and updates the game state.
 * @param {number} index The index of the producer to buy.
 */
function buyProducer(index) {
    const producer = producers[index];
    if (eggs >= producer.currentCost) {
        eggs -= producer.currentCost;
        producer.count++;
        eggsPerSecond += producer.baseEps;
        producer.currentCost = producer.baseCost * Math.pow(COST_MULTIPLIER, producer.count);
        
        // Update producer item display
        const countSpan = document.getElementById(`producer-count-${index}`);
        const costSpan = document.getElementById(`producer-cost-${index}`);
        if (countSpan && costSpan) {
            countSpan.textContent = producer.count;
            costSpan.textContent = formatNumber(producer.currentCost);
        }

        updateDisplay();
        saveGame();
    } else {
        showMessage("Not enough eggs!");
    }
}

/**
 * Renders the producer list dynamically.
 */
function renderProducers() {
    producersContainer.innerHTML = '';
    producers.forEach((producer, index) => {
        producer.currentCost = producer.baseCost; // Initialize current cost
        const producerItem = document.createElement('div');
        producerItem.classList.add('producer-item');
        producerItem.innerHTML = `
            <div class="producer-info">
                <h3>${producer.name}</h3>
                <p>Count: <span id="producer-count-${index}">${producer.count}</span></p>
            </div>
            <div class="producer-info">
                <p>+${formatNumber(producer.baseEps)} EPS</p>
                <p>Cost: <span id="producer-cost-${index}">${formatNumber(producer.currentCost)}</span></p>
            </div>
            <button id="buy-button-${index}" class="buy-button">Buy</button>
        `;
        producersContainer.appendChild(producerItem);

        document.getElementById(`buy-button-${index}`).addEventListener('click', () => {
            buyProducer(index);
        });
    });
}

/**
 * Unlocks and updates the current zone based on total eggs.
 */
function unlockZones() {
    let currentZone = zones[0];
    let nextZone = null;
    
    for (let i = 0; i < zones.length; i++) {
        if (bestEggs >= zones[i].milestone) {
            currentZone = zones[i];
            if (document.body.classList[0] !== currentZone.class) {
                 document.body.className = '';
                 document.body.classList.add(currentZone.class);
            }
        }
        if (bestEggs < zones[i].milestone) {
            nextZone = zones[i];
            break;
        }
    }

    currentZoneDisplay.textContent = currentZone.name;
    if (nextZone) {
        nextZoneDisplay.textContent = nextZone.name;
        nextZoneMilestoneDisplay.textContent = formatNumber(nextZone.milestone);
    } else {
        nextZoneDisplay.textContent = "You've reached the final zone!";
        nextZoneMilestoneDisplay.textContent = "---";
    }
}

/**
 * Initiates the prestige mechanic.
 */
function prestige() {
    if (bestEggs >= PRESTIGE_MILESTONE) {
        // Calculate feathers to earn
        const feathersEarned = Math.floor(Math.sqrt(bestEggs / PRESTIGE_MILESTONE));
        goldenFeathers += feathersEarned;
        showMessage(`You prestiged and earned ${feathersEarned} Golden Feathers!`);
        
        // Reset all game state except Golden Feathers and bestEggs
        eggs = 0;
        eggsPerClick = 1;
        eggsPerSecond = 0;
        
        producers.forEach(p => {
            p.count = 0;
            p.currentCost = p.baseCost;
        });
        
        renderProducers(); // Re-render to reset costs and counts
        updateDisplay();
        saveGame();
    }
}

/**
 * Saves the game state to localStorage.
 */
function saveGame() {
    const gameState = {
        eggs,
        goldenFeathers,
        bestEggs,
        lastSaveTime: Date.now(),
        producers: producers.map(p => ({
            count: p.count,
            currentCost: p.currentCost
        }))
    };
    localStorage.setItem('eggClickerSave', JSON.stringify(gameState));
}

/**
 * Loads the game state from localStorage.
 */
function loadGame() {
    const savedState = localStorage.getItem('eggClickerSave');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        eggs = gameState.eggs;
        goldenFeathers = gameState.goldenFeathers;
        bestEggs = gameState.bestEggs || 0;
        lastSaveTime = gameState.lastSaveTime;
        
        // Load producer counts and costs
        if (gameState.producers) {
            gameState.producers.forEach((savedProducer, index) => {
                producers[index].count = savedProducer.count;
                producers[index].currentCost = savedProducer.currentCost;
                eggsPerSecond += producers[index].baseEps * savedProducer.count;
            });
        }
        
        // Calculate offline progress
        calculateOfflineProgress();

        // Re-render producers with loaded data
        renderProducers();
        
        showMessage("Game loaded!");
    } else {
         renderProducers();
         showMessage("Welcome! Your journey begins now.");
    }
    updateDisplay();
}

/**
 * Calculates and applies offline earnings.
 */
function calculateOfflineProgress() {
    const now = Date.now();
    const elapsed = (now - lastSaveTime) / 1000; // time in seconds
    const cappedElapsed = Math.min(elapsed, OFFLINE_CAP);
    const featherBonus = goldenFeathers * FEATHER_BONUS;
    const totalEps = eggsPerSecond * (1 + featherBonus);
    const offlineEggs = cappedElapsed * totalEps;

    if (offlineEggs > 0) {
        eggs += offlineEggs;
        bestEggs = Math.max(bestEggs, eggs);
        showMessage(`Welcome back! You earned ${formatNumber(offlineEggs)} eggs while you were away.`);
    }
}

/**
 * The main game loop for passive income.
 */
function gameLoop() {
    const featherBonus = goldenFeathers * FEATHER_BONUS;
    const totalEps = eggsPerSecond * (1 + featherBonus);
    eggs += totalEps;
    bestEggs = Math.max(bestEggs, eggs);
    updateDisplay();
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load saved game and initialize
    loadGame();

    // Set up main chicken button click handler
    chickenButton.addEventListener('click', tapChicken);

    // Set up prestige button click handler
    prestigeButton.addEventListener('click', prestige);

    // Game loops
    setInterval(gameLoop, 1000); // 1 second loop for EPS
    setInterval(saveGame, 10000); // 10 second autosave
});

