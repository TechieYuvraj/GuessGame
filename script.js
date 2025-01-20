// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import firebaseConfig from './firebaseConfig.js';
firebase.initializeApp(firebaseConfig);

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const guessPhase = document.getElementById("guessPhase");
const processingPhase = document.getElementById("processingPhase");
const resultPhase = document.getElementById("resultPhase");
const submitButton = document.getElementById("submitButton");
const tryAgainButton = document.getElementById("tryAgainButton");
const shareButton = document.getElementById("shareButton");

let timerElement = document.getElementById("timer");
let timerInterval;
let countdownTime = 30; // Countdown in seconds
let userGuess = null;

submitButton.addEventListener("click", processGuess);
tryAgainButton.addEventListener("click", resetGame);
shareButton.addEventListener("click", shareGuess);

function startTimer() {
    console.log("Timer started!"); //Debugging line
    countdownTime = 10; // Reset timer
    timerElement.textContent = `Time left: ${countdownTime}s`;

    timerInterval = setInterval(() => {
        countdownTime--;
        timerElement.textContent = `Time left: ${countdownTime}s`;

        if (countdownTime <= 0) {
            clearInterval(timerInterval); // Stop the timer
            handleTimeout(); // Handle timeout case
        }
    }, 1000); // Update every second
}

function handleTimeout() {
    const randomNumber = Math.floor(Math.random() * 100); // Pick a random number for the timeout message
    const timeoutMessage = `Time's up! We knew you would pick ${randomNumber}.`;

    // Display playful timeout message in the result phase
    resultPhase.classList.add("active");
    resultPhase.innerHTML = `<h1>${timeoutMessage}</h1><button id="tryAgainButton">Try Again</button>`;
    userGuess = randomNumber; // Set a fake guess for fun

    // Attach the event listener for the "Try Again" button after it's rendered
    const tryAgainButton = document.getElementById("tryAgainButton");
    tryAgainButton.addEventListener("click", resetGame);
}

function processGuess() {
    const guessInput = document.getElementById("guessInput");
    const resultDiv = document.getElementById("result");
    userGuess = guessInput.value;

    if (userGuess === "" || isNaN(userGuess) || userGuess < 0 || userGuess > 99) {
        alert("Please enter a valid number between 00 and 99!");
        return;
    }

    // Stop the timer when the guess is submitted
    clearInterval(timerInterval);

    // Transition to processing phase
    guessPhase.classList.remove("active");
    processingPhase.classList.add("active");

    const drumroll = new Audio("drumroll.mp3");
    const ding = new Audio("ding.mp3");
    drumroll.play();

    const messages = [
        "Hmm, interesting choice...",
        "Analyzing your mind...",
        "Are you sure about this number?",
        "Calculating... Almost done...",
        "Finalizing the result..."
    ];

    let index = 0;
    const interval = setInterval(() => {
        processingPhase.querySelector(".loading p").innerHTML = messages[index];
        index++;

        if (index >= messages.length) {
            clearInterval(interval);

            // Transition to result phase
            drumroll.pause();
            ding.play();
            processingPhase.classList.remove("active");
            resultPhase.classList.add("active");

            // Show result and leaderboard
            updateGuessData(userGuess);
            resultDiv.innerHTML = `You guessed this number: <strong>${userGuess}</strong>`;
            
            // Display a random psychology or game-related fact with the result
            const psychologyFact = getPsychologyFact();
            resultDiv.innerHTML += `<p><em>Psychology Fact: ${psychologyFact}</em></p>`;

            displayLeaderboard();
        }
    }, 1000); // Update every second
}

function getPsychologyFact() {
    const facts = [
        "People often choose numbers that they feel have personal significance, like 7, 3, or 10.",
        "Studies show that most people tend to avoid guessing extremes like 0 or 99 in number games.",
        "In psychology, the 'anchoring effect' causes people to start their guesses based on initial numbers they see.",
        "The most common number guessed in random-number games is 7. This is due to its 'lucky' association.",
        "Humans are often overconfident in their guesses, thinking they can predict random numbers."
    ];

    return facts[Math.floor(Math.random() * facts.length)];
}

function updateGuessData(guess) {
    const guessRef = database.ref('guesses/' + guess);
    guessRef.transaction((count) => {
        return (count || 0) + 1;
    });
}

function displayLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");
    const guessRef = database.ref('guesses');

    guessRef.once('value', (snapshot) => {
        const guessData = snapshot.val() || {};
        const sortedGuesses = Object.entries(guessData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        leaderboardDiv.innerHTML = "<h3>Leaderboard</h3>";
        if (sortedGuesses.length === 0) {
            leaderboardDiv.innerHTML += "<p>No guesses yet!</p>";
        } else {
            const leaderboardList = sortedGuesses
                .map(([number, count]) => `<li>${number}: ${count} guesses</li>`)
                .join("");
            leaderboardDiv.innerHTML += `<ul>${leaderboardList}</ul>`;
        }
    });
}

function shareGuess() {
    if (!userGuess) {
        alert("Please make a guess before sharing!");
        return;
    }

    const shareText = `I guessed the number ${userGuess} in a fun guessing game! Check out this awesome game and try your luck at guessing the number. Can you beat my guess? 🎮🧠`;
    const shareUrl = window.location.href; // Share the current URL of the game

    // Using the Web Share API for mobile and supported browsers
    if (navigator.share) {
        navigator.share({
            title: "Guess the Number Game",
            text: shareText,
            url: shareUrl
        }).then(() => {
            console.log('Shared successfully');
        }).catch((error) => {
            console.error('Error sharing:', error);
        });
    } else {
        // Fallback for unsupported browsers (URL share)
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(shareUrl);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

        // Prompt to open the share links in a new window
        window.open(facebookUrl, "_blank"); // Facebook
        window.open(twitterUrl, "_blank");  // Twitter
    }
}

function resetGame() {
    resultPhase.classList.remove("active");
    guessPhase.classList.add("active");
    document.getElementById("guessInput").value = "";
    timerElement.textContent = ""; // Hide timer
    startTimer(); // Restart timer
}

// Start the timer when the game begins
startTimer();
