let userQuizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
let quizzes = [];
let builtinQuizzes = [];
let isEditing = false;
let editingIndex = -1;

let beforeUnloadHandler = function (e) {
    if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
};
function enableEditUnloadWarning() {
    window.addEventListener('beforeunload', beforeUnloadHandler);
}
function disableEditUnloadWarning() {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
}

let currentQuiz = null;
let currentQuestions = [];

fetch('builtin_quizzes.json')
    .then(res => res.json())
    .then(data => {
        builtinQuizzes = data;
        quizzes = [...builtinQuizzes, ...userQuizzes]; // merge builtin + user quizzes
        loadHome(); // render Home Screen after loading quizzes
    })
    .catch(err => {
        console.error("Error loading builtin quizzes:", err);
        builtinQuizzes = [];
        quizzes = [...userQuizzes]; // fallback to user quizzes only
        loadHome();
    });

function loadHome() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <div class="h-full flex items-center justify-center">
            <div class="w-full max-w-4xl">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="glass-card p-8 hover-lift animate-fadeInUp cursor-pointer" onclick="loadCreateQuiz()">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                <i class="fas fa-plus text-2xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Create Quiz</h3>
                        </div>
                    </div>
                    
                    <div class="glass-card p-8 hover-lift animate-fadeInUp delay-100 cursor-pointer" onclick="loadTakeQuiz()">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-play text-2xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Take Quiz</h3>
                        </div>
                    </div>
                    
                    <div class="glass-card p-8 hover-lift animate-fadeInUp delay-200 cursor-pointer" onclick="ManageQuiz()">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-cog text-2xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">Manage Quiz</h3>
                        </div>
                    </div>
                    
                    <div class="glass-card p-8 hover-lift animate-fadeInUp delay-300 cursor-pointer" onclick="loadScores()">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-chart-line text-2xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800">View Scores</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadTakeQuiz() {
    const container = document.getElementById("main-container");

    if (!quizzes.length) {
        container.innerHTML = `
            <div class="glass-card p-8 text-center animate-fadeInUp">
                <div class="mb-6">
                    <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">No Quizzes Available</h2>
                    <p class="text-gray-600">Create your first quiz to get started!</p>
                </div>
                <button class="btn-modern btn-primary" onclick="loadCreateQuiz()">
                    <i class="fas fa-plus"></i>
                    Create Quiz
                </button>
            </div>
        `;
        return;
    }

    let quizCards = quizzes.map((q, index) => {
        return `
            <div class="quiz-card p-6 hover-lift animate-fadeInUp delay-${(index % 5) * 100}">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${q.title}</h3>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        ${q.questions.length} questions
                    </span>
                </div>
                ${q.description ? `<p class="text-gray-600 mb-4">${q.description}</p>` : ''}
                <button class="btn-modern btn-success w-full" onclick="chooseMode(${index})">
                    <i class="fas fa-play"></i>
                    Start Quiz
                </button>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-rocket mr-3"></i>Select a Quiz
                </h2>
                <p class="text-gray-600">Choose from ${quizzes.length} available quiz${quizzes.length !== 1 ? 'es' : ''}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                ${quizCards}
            </div>
            <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                <i class="fas fa-arrow-left"></i>
                Back to Home
            </button>
        </div>
    `;
}

function chooseMode(index) {
    const container = document.getElementById("main-container");
    const quiz = quizzes[index];

    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-4">
                    <i class="fas fa-cog mr-3"></i>${quiz.title}
                </h2>
                <div class="bg-blue-50 rounded-2xl p-6 mb-6">
                    <div class="flex items-center justify-center mb-4">
                        <i class="fas fa-question-circle text-4xl text-blue-600 mr-4"></i>
                        <div class="text-left">
                            <p class="text-2xl font-bold text-blue-800">${quiz.questions.length}</p>
                            <p class="text-blue-600">Total Questions</p>
                        </div>
                    </div>
                    ${quiz.description ? `<p class="text-gray-600 italic">"${quiz.description}"</p>` : ''}
                </div>
            </div>
            
            <div class="mb-8">
                <label for="numQ" class="block text-lg font-semibold text-gray-700 mb-4">
                    <i class="fas fa-sliders-h mr-2"></i>How many questions do you want to attempt?
                </label>
                <div class="relative">
                    <input id="numQ" type="number" min="1" max="${quiz.questions.length}" value="${quiz.questions.length}" 
                        class="input-modern focus-ring text-center text-xl font-bold">
                    <div class="absolute inset-y-0 right-0 flex items-center pr-4">
                        <span class="text-gray-500 font-medium">/ ${quiz.questions.length}</span>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <button class="btn-modern btn-primary w-full text-lg" id="startBtn">
                    <i class="fas fa-play"></i> Start Quiz
                </button>
                <button class="btn-modern btn-secondary w-full" onclick="loadTakeQuiz()">
                    <i class="fas fa-arrow-left"></i> Back to Quiz Selection
                </button>
            </div>
        </div>
    `;

    const startBtn = document.getElementById("startBtn");
    startBtn.onclick = () => {
        const numInput = document.getElementById("numQ");
        let numQuestions = parseInt(numInput.value);
        const totalQuestions = quiz.questions.length;

        if (isNaN(numQuestions) || numQuestions < 1) {
            showToast("Please enter a valid number of questions!", "warning");
            return;
        }

        if (numQuestions > totalQuestions) {
            showToast(`You can attempt at most ${totalQuestions} questions!`, "error");
            numQuestions = totalQuestions;
            numInput.value = totalQuestions;
            return;
        }

        startQuiz(index, numQuestions);
    }
}

function startQuiz(index) {
    const quiz = quizzes[index];
    const numQ = parseInt(document.getElementById("numQ").value) || quiz.questions.length;

    // Shuffle and slice questions
    const selectedQuestions = quiz.questions
        .sort(() => Math.random() - 0.5)
        .slice(0, numQ);

    const container = document.getElementById("main-container");
    let currentQ = 0;
    let score = 0;
    let timer; // for countdown

    function loadQuestion() {
        const q = selectedQuestions[currentQ];
        let timeLeft = 10; // seconds per question

        container.innerHTML = `
            <div class="question-card p-8 animate-fadeInUp">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold text-gradient mb-4">
                        <i class="fas fa-brain mr-3"></i>${quiz.title}
                    </h2>
                    <div class="flex justify-between items-center mb-6">
                        <div class="bg-blue-100 px-4 py-2 rounded-full">
                            <span class="text-blue-800 font-semibold">
                                Question ${currentQ + 1} of ${selectedQuestions.length}
                            </span>
                        </div>
                        <div id="timer" class="timer ${timeLeft <= 3 ? 'warning' : ''}">
                            <i class="fas fa-clock mr-2"></i>${timeLeft}s
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((currentQ + 1) / selectedQuestions.length) * 100}%"></div>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6 text-center leading-relaxed">
                        ${q.text}
                    </h3>
            </div>
                
                <div class="space-y-4">
                ${q.options.map((opt, i) => 
                        `<button class="option-btn hover-scale" 
                             onclick="selectAnswer('${i}', '${q.answer}')">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold mr-4">
                                ${String.fromCharCode(65+i)}
                            </span>
                            ${opt}
                    </button>`
                ).join('')}
                </div>
            </div>
        `;

        // start timer
        timer = setInterval(() => {
            timeLeft--;
            const timerElement = document.getElementById("timer");
            timerElement.innerHTML = `<i class="fas fa-clock mr-2"></i>${timeLeft}s`;
            
            // Add warning class when time is running low
            if (timeLeft <= 3) {
                timerElement.classList.add('warning');
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                currentQ++;
                if (currentQ < selectedQuestions.length) loadQuestion();
                else showResult();
            }
        }, 1000);
    }

    window.selectAnswer = function(selected, correct) {
        clearInterval(timer); // stop timer when answered
        if (selected === correct) score++;
        currentQ++;
        if (currentQ < selectedQuestions.length) loadQuestion();
        else showResult();
    }

    function showResult() {
        // Persist score attempt
        try {
            const attempts = JSON.parse(localStorage.getItem('scores')) || [];
            attempts.unshift({
                title: quiz.title,
                date: new Date().toISOString(),
                score: score,
                total: selectedQuestions.length
            });
            localStorage.setItem('scores', JSON.stringify(attempts));
        } catch (e) {
            console.error('Failed to save score:', e);
        }
        
        const percentage = Math.round((score / selectedQuestions.length) * 100);
        let resultClass = 'btn-success';
        let resultIcon = 'fas fa-trophy';
        let resultMessage = 'Excellent!';
        
        if (percentage < 50) {
            resultClass = 'btn-danger';
            resultIcon = 'fas fa-redo';
            resultMessage = 'Keep practicing!';
        } else if (percentage < 80) {
            resultClass = 'btn-warning';
            resultIcon = 'fas fa-thumbs-up';
            resultMessage = 'Good job!';
        }
        
        container.innerHTML = `
            <div class="score-display animate-fadeInScale">
                <div class="text-center mb-8">
                    <i class="${resultIcon} text-6xl mb-4"></i>
                    <h2 class="text-3xl font-bold mb-2">${quiz.title}</h2>
                    <p class="text-xl opacity-90">${resultMessage}</p>
                </div>
                
                <div class="bg-white/20 rounded-2xl p-6 mb-8">
                    <div class="text-center">
                        <div class="text-6xl font-bold mb-2">${score}/${selectedQuestions.length}</div>
                        <div class="text-2xl font-semibold mb-4">${percentage}%</div>
                        <div class="w-full bg-white/30 rounded-full h-4 mb-4">
                            <div class="bg-white h-4 rounded-full transition-all duration-1000" 
                                 style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <button class="btn-modern ${resultClass} w-full text-lg" onclick="loadHome()">
                        <i class="fas fa-home"></i>
                Back to Home
            </button>
                    <button class="btn-modern btn-secondary w-full" onclick="loadTakeQuiz()">
                        <i class="fas fa-redo"></i>
                        Take Another Quiz
                    </button>
                </div>
            </div>
        `;
    }

    loadQuestion();
}

function createQuiz() {
    const title = document.getElementById("quizTitle").value.trim();
    const description = document.getElementById("quizDescription").value.trim();
    
    if (!title) {
        showToast("Please enter a quiz title!", 'warning');
        return;
    }
    
    // Initialize new quiz
    currentQuiz = {
        title: title,
        description: description,
        questions: []
    };
    currentQuestions = [];
    
    // Show quiz dashboard
    showQuizDashboard();
}

function showQuizDashboard(isEditing = false) {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-edit mr-3"></i>Quiz Dashboard
                </h2>
                <p class="text-gray-600">Working on: "${currentQuiz.title}"</p>
            </div>
            
            <div class="bg-blue-50 rounded-2xl p-6 mb-8">
                <div class="flex items-center justify-center mb-4">
                    <i class="fas fa-list-ol text-4xl text-blue-600 mr-4"></i>
                    <div class="text-left">
                        <p class="text-2xl font-bold text-blue-800">${currentQuestions.length}</p>
                        <p class="text-blue-600">Questions Added</p>
                    </div>
                </div>
                ${currentQuiz.description ? `<p class="text-gray-600 italic text-center">"${currentQuiz.description}"</p>` : ''}
            </div>
            
            <div class="space-y-4">
                <button class="btn-modern btn-success w-full" onclick="showAddQuestionForm()">
                    <i class="fas fa-plus"></i>
                    Add Question
                </button>
                <button class="btn-modern btn-primary w-full" onclick="saveQuiz()">
                    <i class="fas fa-save"></i>
                    Save Quiz
                </button>
                <button class="btn-modern btn-danger w-full" onclick="deleteCurrentQuiz()">
                    <i class="fas fa-trash"></i>
                    Delete Quiz
                </button>
                ${isEditing ? '' : '<button class="btn-modern btn-secondary w-full" onclick="loadCreateQuiz()"><i class="fas fa-arrow-left"></i>Back to Create Menu</button>'}
            </div>
        </div>
    `;
}

function loadCreateQuiz() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-plus-circle mr-3"></i>Create New Quiz
                </h2>
                <p class="text-gray-600">Design your own custom quiz with multiple choice questions</p>
            </div>
            
            <div class="space-y-6">
                <div>
                    <label for="quizTitle" class="block text-lg font-semibold text-gray-700 mb-3">
                        <i class="fas fa-heading mr-2"></i>Quiz Title
                    </label>
                    <input type="text" id="quizTitle" placeholder="Enter a title for your quiz" 
                           class="input-modern focus-ring">
                </div>
                
                <div>
                    <label for="quizDescription" class="block text-lg font-semibold text-gray-700 mb-3">
                        <i class="fas fa-align-left mr-2"></i>Quiz Description
                    </label>
                    <input type="text" id="quizDescription" placeholder="Describe what this quiz is about (optional)" 
                           class="input-modern focus-ring">
                </div>
            </div>
            
            <div class="space-y-4 mt-8">
                <button class="btn-modern btn-primary w-full text-lg" onclick="createQuiz()">
                    <i class="fas fa-magic"></i>
                    Create Quiz
                </button>
                <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Home
                </button>
            </div>
        </div>
    `;
}

function showAddQuestionForm() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-question-circle mr-3"></i>Add Question
                </h2>
                <p class="text-gray-600">Add a new question to "${currentQuiz.title}"</p>
            </div>
            
            <div class="space-y-6">
                <div>
                    <label for="questionText" class="block text-lg font-semibold text-gray-700 mb-3">
                        <i class="fas fa-question mr-2"></i>Question Text
                    </label>
                    <input type="text" id="questionText" placeholder="Enter your question here" 
                           class="input-modern focus-ring">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="optionA" class="block text-sm font-medium text-gray-700 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">A</span>Option A
                        </label>
                        <input type="text" id="optionA" placeholder="First option" 
                               class="input-modern focus-ring">
                    </div>
                    <div>
                        <label for="optionB" class="block text-sm font-medium text-gray-700 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">B</span>Option B
                        </label>
                        <input type="text" id="optionB" placeholder="Second option" 
                               class="input-modern focus-ring">
                    </div>
                    <div>
                        <label for="optionC" class="block text-sm font-medium text-gray-700 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">C</span>Option C
                        </label>
                        <input type="text" id="optionC" placeholder="Third option" 
                               class="input-modern focus-ring">
                    </div>
                    <div>
                        <label for="optionD" class="block text-sm font-medium text-gray-700 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">D</span>Option D
                        </label>
                        <input type="text" id="optionD" placeholder="Fourth option" 
                               class="input-modern focus-ring">
                    </div>
                </div>
                
                <div>
                    <label for="correctAnswer" class="block text-lg font-semibold text-gray-700 mb-3">
                        <i class="fas fa-check-circle mr-2"></i>Correct Answer
                    </label>
                    <select id="correctAnswer" class="input-modern focus-ring">
                        <option value="0">A - First Option</option>
                        <option value="1">B - Second Option</option>
                        <option value="2">C - Third Option</option>
                        <option value="3">D - Fourth Option</option>
        </select>
                </div>
            </div>
            
            <div class="space-y-4 mt-8">
                <button class="btn-modern btn-success w-full text-lg" onclick="saveQuestion()">
                    <i class="fas fa-save"></i>
                    Save Question
                </button>
                <button class="btn-modern btn-secondary w-full" onclick="showQuizDashboard()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Dashboard
                </button>
            </div>
        </div>
    `;
}

function saveQuestion() {
    const text = document.getElementById("questionText").value.trim();
    const optionA = document.getElementById("optionA").value.trim();
    const optionB = document.getElementById("optionB").value.trim();
    const optionC = document.getElementById("optionC").value.trim();
    const optionD = document.getElementById("optionD").value.trim();
    const correctAnswer = parseInt(document.getElementById("correctAnswer").value);
    
    if (!text || !optionA || !optionB || !optionC || !optionD) {
        showToast("Please fill in all fields!", 'warning');
        return;
    }
    
    const question = {
        text: text,
        options: [optionA, optionB, optionC, optionD],
        answer: correctAnswer.toString()
    };
    
    currentQuestions.push(question);
    showToast("Question added successfully!", 'success');
    showQuizDashboard();
}

function saveQuiz() {
    if (currentQuestions.length === 0) {
        showToast("Please add at least one question before saving!", 'warning');
        return;
    }
    
    currentQuiz.questions = currentQuestions;
    if (isEditing && editingIndex > -1) {
        userQuizzes[editingIndex] = currentQuiz;
    } else {
        userQuizzes.push(currentQuiz);
    }
    
    // Save to localStorage
    localStorage.setItem("quizzes", JSON.stringify(userQuizzes));
    
    // Update the main quizzes array from builtin + user quizzes
    quizzes = [...builtinQuizzes, ...userQuizzes];
    
    showToast(`Quiz "${currentQuiz.title}" saved successfully!`, 'success');
    
    // Reset and go back to create menu
    currentQuiz = null;
    currentQuestions = [];
    isEditing = false;
    editingIndex = -1;
    disableEditUnloadWarning();
    loadCreateQuiz();
}

function deleteCurrentQuiz() {
    if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
        currentQuiz = null;
        currentQuestions = [];
        if (isEditing) {
            isEditing = false;
            editingIndex = -1;
            disableEditUnloadWarning();
        }
        loadCreateQuiz();
    }
}

function ManageQuiz() {
    const container = document.getElementById("main-container");
    
    if (userQuizzes.length === 0) {
        container.innerHTML = `
            <div class="glass-card p-8 text-center animate-fadeInUp">
                <div class="mb-8">
                    <i class="fas fa-folder-open text-6xl text-gray-400 mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">My Quizzes</h2>
                    <p class="text-gray-600 text-lg">No quizzes created yet. Start building your collection!</p>
                </div>
                <div class="space-y-4">
                    <button class="btn-modern btn-primary w-full" onclick="loadCreateQuiz()">
                        <i class="fas fa-plus"></i>
                        Create Your First Quiz
                    </button>
                    <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                        <i class="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    let quizList = userQuizzes.map((quiz, index) => `
        <div class="quiz-card p-6 hover-lift animate-fadeInUp delay-${(index % 5) * 100}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${quiz.title}</h3>
                    ${quiz.description ? `<p class="text-gray-600 mb-3">${quiz.description}</p>` : ''}
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-question-circle mr-2"></i>
                        <span>${quiz.questions.length} questions</span>
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button class="btn-modern btn-danger text-sm px-3 py-2" onclick="deleteSavedQuiz(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-modern btn-warning text-sm px-3 py-2" onclick="editSavedQuiz(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-cog mr-3"></i>My Quizzes
                </h2>
                <p class="text-gray-600">Manage your ${userQuizzes.length} quiz${userQuizzes.length !== 1 ? 'es' : ''}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        ${quizList}
            </div>
            <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                <i class="fas fa-arrow-left"></i>
                Back to Home
            </button>
        </div>
    `;
}

function deleteSavedQuiz(index) {
    const quiz = userQuizzes[index];
    if (confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
        userQuizzes.splice(index, 1);
        localStorage.setItem("quizzes", JSON.stringify(userQuizzes));
        
        // Update the main quizzes array - remove deleted quiz completely
        quizzes = quizzes.filter(q => q !== quiz);
        
        showToast(`Quiz "${quiz.title}" deleted successfully!`, 'success');
        ManageQuiz(); // Refresh the list
    }
}

function editSavedQuiz(index) {
    const quiz = userQuizzes[index];
    if (confirm(`Edit "${quiz.title}"? This will start editing the quiz.`)) {
        // Load the quiz for editing
        currentQuiz = { ...quiz };
        currentQuestions = [...quiz.questions];
        isEditing = true;
        editingIndex = index;
        enableEditUnloadWarning();
        
        // Show quiz dashboard for editing (no back button)
        showQuizDashboard(true);
    }
}

function loadScores() {
    const container = document.getElementById('main-container');
    const attempts = JSON.parse(localStorage.getItem('scores')) || [];
    if (attempts.length === 0) {
        container.innerHTML = `
            <div class="glass-card p-8 text-center animate-fadeInUp">
                <div class="mb-8">
                    <i class="fas fa-chart-line text-6xl text-gray-400 mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">Score History</h2>
                    <p class="text-gray-600 text-lg">No quiz attempts yet. Take a quiz to see your scores here!</p>
                </div>
                <div class="space-y-4">
                    <button class="btn-modern btn-primary w-full" onclick="loadTakeQuiz()">
                        <i class="fas fa-play"></i>
                        Take a Quiz
                    </button>
                    <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                        <i class="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const list = attempts.map((a, index) => {
        const d = new Date(a.date);
        const when = d.toLocaleString();
        const percentage = Math.round((a.score / a.total) * 100);
        let scoreClass = 'text-green-600';
        let scoreIcon = 'fas fa-trophy';
        
        if (percentage < 50) {
            scoreClass = 'text-red-600';
            scoreIcon = 'fas fa-redo';
        } else if (percentage < 80) {
            scoreClass = 'text-yellow-600';
            scoreIcon = 'fas fa-thumbs-up';
        }
        
        return `
            <div class="quiz-card p-6 hover-lift animate-fadeInUp delay-${(index % 5) * 100}">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <i class="${scoreIcon} ${scoreClass} text-2xl mr-4"></i>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${a.title}</h3>
                            <p class="text-sm text-gray-500">${when}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold ${scoreClass}">${a.score}/${a.total}</div>
                        <div class="text-sm text-gray-500">${percentage}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="glass-card p-8 animate-fadeInUp">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gradient mb-2">
                    <i class="fas fa-chart-line mr-3"></i>Score History
                </h2>
                <p class="text-gray-600">Your ${attempts.length} quiz attempt${attempts.length !== 1 ? 's' : ''}</p>
            </div>
            <div class="space-y-4 mb-8">
        ${list}
            </div>
            <div class="space-y-4">
                <button class="btn-modern btn-danger w-full" onclick="clearScores()">
                    <i class="fas fa-trash"></i>
                    Clear History
                </button>
                <button class="btn-modern btn-secondary w-full" onclick="loadHome()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Home
                </button>
            </div>
        </div>
    `;
}

function clearScores() {
    if (!confirm('Clear all score history?')) return;
    localStorage.removeItem('scores');
    showToast('Score history cleared successfully!', 'success');
    loadScores();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-slideInRight`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 type === 'warning' ? 'fas fa-exclamation-triangle' : 
                 'fas fa-info-circle';
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} mr-3 text-lg"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.5s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }, 3000);
}

function showAlert(message, type = 'info') {
    showToast(message, type);
}

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
}