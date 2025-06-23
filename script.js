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
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    choicesContainer: document.getElementById('choicesContainer'),
    explanationContainer: document.getElementById('explanationContainer'),
    explanationText: document.getElementById('explanationText'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
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

// Initialize the quiz
async function startQuiz() {
    // Show loading message
    elements.startBtn.textContent = '読み込み中...';
    elements.startBtn.disabled = true;
    
    // Load quiz data from JSON file
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
    
    currentQuestionIndex = 0;
    userAnswers = [];
    quizCompleted = false;
    answerRevealed = false;
    showScreen('quiz');
    loadQuestion();
    updateProgress();
}

// Screen management
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
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
    
    // Show explanation
    elements.explanationText.innerHTML = question.explanation;
    elements.explanationContainer.classList.remove('hidden');
    answerRevealed = true;
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
                ${question.explanation}
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