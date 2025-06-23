// Quiz data will be loaded from JSON file
let quizData = [];

// Quiz state
let currentQuestionIndex = 0;
let userAnswers = [];
let quizCompleted = false;
let answerRevealed = false;

// DOM elements
const screens = {
    start: document.getElementById('startScreen'),
    quiz: document.getElementById('quizScreen'),
    results: document.getElementById('resultsScreen'),
    review: document.getElementById('reviewScreen')
};

const elements = {
    startBtn: document.getElementById('startBtn'),
    welcomeText: document.getElementById('welcomeText'),
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    choicesContainer: document.getElementById('choicesContainer'),
    explanationContainer: document.getElementById('explanationContainer'),
    explanationText: document.getElementById('explanationText'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    answerRecord: document.getElementById('answerRecord'),
    scoreText: document.getElementById('scoreText'),
    scorePercentage: document.getElementById('scorePercentage'),
    resultsSummary: document.getElementById('resultsSummary'),
    reviewBtn: document.getElementById('reviewBtn'),
    restartBtn: document.getElementById('restartBtn'),
    reviewQuestions: document.getElementById('reviewQuestions'),
    backToResultsBtn: document.getElementById('backToResultsBtn')
};

// Event listeners
elements.startBtn.addEventListener('click', startQuiz);
elements.prevBtn.addEventListener('click', goToPreviousQuestion);
elements.nextBtn.addEventListener('click', goToNextQuestion);
elements.reviewBtn.addEventListener('click', showReview);
elements.restartBtn.addEventListener('click', restartQuiz);
elements.backToResultsBtn.addEventListener('click', showResults);

// Touch/swipe navigation
let touchStartX = null;
let touchStartY = null;

// Add touch events to the quiz screen
function initializeTouchNavigation() {
    const quizScreen = document.getElementById('quizScreen');
    
    quizScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
    quizScreen.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Minimum swipe distance (50px)
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Swipe left - go to next question
                if (!elements.nextBtn.disabled) {
                    goToNextQuestion();
                }
            } else {
                // Swipe right - go to previous question
                if (!elements.prevBtn.disabled) {
                    goToPreviousQuestion();
                }
            }
        }
    }
    
    touchStartX = null;
    touchStartY = null;
}

// Keyboard navigation
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    // Only handle navigation when quiz screen is visible
    if (!screens.quiz.classList.contains('hidden')) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (!elements.prevBtn.disabled) {
                    goToPreviousQuestion();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (!elements.nextBtn.disabled) {
                    goToNextQuestion();
                }
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                e.preventDefault();
                const choiceIndex = parseInt(e.key) - 1;
                const choices = elements.choicesContainer.querySelectorAll('.choice');
                if (choices[choiceIndex] && !answerRevealed) {
                    selectChoice(choiceIndex);
                }
                break;
        }
    }
}

// Initialize welcome screen on page load
async function initializeApp() {
    try {
        if (quizData.length === 0) {
            const loadedData = await loadQuizData();
            quizData = loadedData;
        }
        
        // Update welcome text with correct number of questions
        elements.welcomeText.textContent = `${quizData.length}問の日本語問題に挑戦しましょう。各問題には複数の選択肢があります。`;
    } catch (error) {
        console.log('Could not load quiz data for welcome screen, using default text');
        elements.welcomeText.textContent = '日本語問題に挑戦しましょう。各問題には複数の選択肢があります。';
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeTouchNavigation();
    initializeKeyboardNavigation();
});

// Load quiz data from JSON file
async function loadQuizData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading quiz data:', error);
        throw error;
    }
}

// Shuffle array function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize the quiz
async function startQuiz() {
    // Show loading message
    elements.startBtn.textContent = '読み込み中...';
    elements.startBtn.disabled = true;
    
    // Ensure quiz data is loaded
    if (quizData.length === 0) {
        try {
            quizData = await loadQuizData();
        } catch (error) {
            alert('クイズデータの読み込みに失敗しました。サーバーが起動していることを確認してください。');
            elements.startBtn.textContent = 'クイズを始める';
            elements.startBtn.disabled = false;
            return;
        }
    }
    
    // Shuffle questions for random order
    quizData = shuffleArray(quizData);
    
    currentQuestionIndex = 0;
    userAnswers = [];
    quizCompleted = false;
    answerRevealed = false;
    showScreen('quiz');
    initializeAnswerRecord();
    loadQuestion();
    updateProgress();
}

// Screen management
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    
    // Show/hide answer record based on screen
    if (screenName === 'quiz') {
        elements.answerRecord.classList.remove('hidden');
    } else {
        elements.answerRecord.classList.add('hidden');
    }
}

// Initialize answer record display
function initializeAnswerRecord() {
    elements.answerRecord.innerHTML = '';
    
    // Create indicator for each question
    for (let i = 0; i < quizData.length; i++) {
        const indicator = document.createElement('span');
        indicator.className = 'answer-indicator';
        indicator.dataset.questionIndex = i;
        indicator.textContent = '◯'; // Default circle
        indicator.title = `問題 ${i + 1}`;
        
        // Add click handler to jump to question
        indicator.addEventListener('click', () => jumpToQuestion(i));
        
        elements.answerRecord.appendChild(indicator);
    }
}

// Jump to specific question
function jumpToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < quizData.length) {
        currentQuestionIndex = questionIndex;
        loadQuestion();
        updateProgress();
    }
}

// Update answer record when question is answered
function updateAnswerRecord(questionIndex, isCorrect) {
    const indicator = elements.answerRecord.querySelector(`[data-question-index="${questionIndex}"]`);
    if (indicator) {
        indicator.textContent = isCorrect ? '○' : '×';
        indicator.className = `answer-indicator ${isCorrect ? 'correct' : 'incorrect'}`;
    }
}

// Update current question indicator
function updateCurrentQuestionIndicator() {
    // Remove current class from all indicators
    elements.answerRecord.querySelectorAll('.answer-indicator').forEach(indicator => {
        indicator.classList.remove('current');
    });
    
    // Add current class to current question indicator
    const currentIndicator = elements.answerRecord.querySelector(`[data-question-index="${currentQuestionIndex}"]`);
    if (currentIndicator) {
        currentIndicator.classList.add('current');
    }
}

// Load current question
function loadQuestion() {
    const question = quizData[currentQuestionIndex];
    
    elements.questionNumber.textContent = `問題 ${currentQuestionIndex + 1}`;
    elements.questionText.textContent = question.question;
    
    // Clear choices container
    elements.choicesContainer.innerHTML = '';
    
    // Hide explanation initially
    elements.explanationContainer.classList.add('hidden');
    answerRevealed = false;
    
    // Create choice buttons
    question.choices.forEach((choice, index) => {
        const choiceBtn = document.createElement('button');
        choiceBtn.className = 'choice';
        choiceBtn.textContent = `${index + 1}. ${choice}`;
        choiceBtn.dataset.index = index;
        
        // Check if this choice was previously selected
        if (userAnswers[currentQuestionIndex] === index) {
            choiceBtn.classList.add('selected');
        }
        
        choiceBtn.addEventListener('click', () => selectChoice(index));
        elements.choicesContainer.appendChild(choiceBtn);
    });
    
    // If this question was already answered, show the explanation
    if (userAnswers[currentQuestionIndex] !== undefined) {
        showAnswerExplanation(userAnswers[currentQuestionIndex]);
    }
    
    updateNavigationButtons();
    updateCurrentQuestionIndicator();
}

// Handle choice selection
function selectChoice(choiceIndex) {
    // Don't allow selection if answer is already revealed
    if (answerRevealed) return;
    
    userAnswers[currentQuestionIndex] = choiceIndex;
    
    // Show answer explanation immediately
    showAnswerExplanation(choiceIndex);
    
    updateNavigationButtons();
}

// Format explanation text with markdown-like parsing and line breaks
function formatExplanation(text) {
    return text
        // Preserve line breaks
        .replace(/\n/g, '<br>')
        // Bold text (**text** or __text__)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic text (*text* or _text_)
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
        // Code blocks (`code`)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Numbers followed by periods (1. 2. etc.) - make them stand out
        .replace(/(\d+\.\s)/g, '<span class="explanation-number">$1</span>')
        // Japanese quotes (「」) - style them nicely
        .replace(/「([^」]+)」/g, '<span class="explanation-quote">「$1」</span>')
        // Colons followed by explanations - make the label bold
        .replace(/^([^:：]+[:：])/gm, '<strong>$1</strong>')
        // Example patterns (例: or 例文: etc.)
        .replace(/(例[^:：]*[:：])/g, '<span class="explanation-example">$1</span>')
        // Question references (1番: 2番: etc.)
        .replace(/(\d+番[:：])/g, '<span class="explanation-choice">$1</span>');
}

// Show answer explanation
function showAnswerExplanation(userChoiceIndex) {
    const question = quizData[currentQuestionIndex];
    const correctAnswerIndex = question.answer - 1; // -1 because answers are 1-indexed in data
    const isCorrect = userChoiceIndex === correctAnswerIndex;
    
    // Update visual selection and show correct/incorrect
    const choices = elements.choicesContainer.querySelectorAll('.choice');
    choices.forEach((choice, index) => {
        // Disable all choices
        choice.disabled = true;
        
        // Remove previous classes
        choice.classList.remove('selected', 'correct', 'incorrect');
        
        if (index === userChoiceIndex) {
            choice.classList.add('selected');
            choice.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        
        // Always show the correct answer
        if (index === correctAnswerIndex && !isCorrect) {
            choice.classList.add('correct');
        }
    });
    
    // Show formatted explanation
    elements.explanationText.innerHTML = formatExplanation(question.explanation);
    elements.explanationContainer.classList.remove('hidden');
    answerRevealed = true;
    
    // Update answer record
    updateAnswerRecord(currentQuestionIndex, isCorrect);
}

// Navigation functions
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
        updateProgress();
    }
}

function goToNextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
        updateProgress();
    } else if (userAnswers[currentQuestionIndex] !== undefined) {
        // If this is the last question and an answer is selected, finish the quiz
        finishQuiz();
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    elements.prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        elements.nextBtn.textContent = '完了';
        elements.nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
    } else {
        elements.nextBtn.textContent = '次へ';
        elements.nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
    }
}

// Update progress bar and text
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    elements.progressBar.style.setProperty('--progress', `${progress}%`);
    elements.progressText.textContent = `${currentQuestionIndex + 1} / ${quizData.length}`;
}

// Finish the quiz and show results
function finishQuiz() {
    quizCompleted = true;
    calculateAndShowResults();
    showScreen('results');
}

// Calculate score and show results
function calculateAndShowResults() {
    let correctAnswers = 0;
    
    userAnswers.forEach((userAnswer, index) => {
        if (userAnswer === quizData[index].answer - 1) { // -1 because answers are 1-indexed in data
            correctAnswers++;
        }
    });
    
    const percentage = Math.round((correctAnswers / quizData.length) * 100);
    
    elements.scoreText.textContent = `${correctAnswers}/${quizData.length}`;
    elements.scorePercentage.textContent = `${percentage}%`;
    
    // Create results summary
    const summaryHTML = `
        <div class="result-item">
            <span>正解数:</span>
            <span>${correctAnswers}問</span>
        </div>
        <div class="result-item">
            <span>不正解数:</span>
            <span>${quizData.length - correctAnswers}問</span>
        </div>
        <div class="result-item">
            <span>正解率:</span>
            <span>${percentage}%</span>
        </div>
        <div class="result-item">
            <span>評価:</span>
            <span>${getGrade(percentage)}</span>
        </div>
    `;
    
    elements.resultsSummary.innerHTML = summaryHTML;
}

// Get grade based on percentage
function getGrade(percentage) {
    if (percentage >= 90) return '優秀！';
    if (percentage >= 80) return 'とても良い！';
    if (percentage >= 70) return '良い';
    if (percentage >= 60) return '合格';
    return 'もう一度挑戦！';
}

// Show review screen
function showReview() {
    generateReviewContent();
    showScreen('review');
}

// Generate review content
function generateReviewContent() {
    elements.reviewQuestions.innerHTML = '';
    
    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.answer - 1; // -1 because answers are 1-indexed in data
        const isCorrect = userAnswer === correctAnswer;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        const userAnswerText = userAnswer !== undefined ? question.choices[userAnswer] : '未回答';
        const correctAnswerText = question.choices[correctAnswer];
        
        reviewItem.innerHTML = `
            <div class="review-question">
                問題 ${index + 1}: ${question.question}
            </div>
            
            <div class="review-answer ${isCorrect ? 'correct' : 'incorrect'}">
                あなたの答え: ${userAnswerText} ${isCorrect ? '✓' : '✗'}
            </div>
            
            ${!isCorrect ? `
                <div class="review-answer correct">
                    正解: ${correctAnswerText} ✓
                </div>
            ` : ''}
            
            <div class="review-explanation">
                <strong>解説:</strong><br>
                ${formatExplanation(question.explanation)}
            </div>
        `;
        
        elements.reviewQuestions.appendChild(reviewItem);
    });
}

// Show results screen
function showResults() {
    showScreen('results');
}

// Restart quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    quizCompleted = false;
    showScreen('start');
}

// Update progress bar CSS custom property
function updateProgressBarStyle() {
    const progressBar = document.getElementById('progressBar');
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressBar.style.setProperty('--progress-width', `${progress}%`);
}

// Add CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
    .progress-bar::after {
        width: var(--progress-width, 10%);
    }
`;
document.head.appendChild(style);

// Initialize progress bar
updateProgressBarStyle(); 