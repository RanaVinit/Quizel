let userQuizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
let quizzes = []; // final array for display
let builtinQuizzes = [];
let isEditing = false;
let editingIndex = -1;

// Before-unload warning when editing
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

// Global variables for quiz creation
let currentQuiz = null; // stores the quiz being created
let currentQuestions = []; // stores questions being added to current quiz

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
        <button class="bg-blue-500 text-white p-2 w-full mb-2 rounded" onclick="loadCreateQuiz()">Create Quiz</button>
        <button class="bg-green-500 text-white p-2 w-full mb-2 rounded" onclick="loadTakeQuiz()">Take Quiz</button>
        <button class="bg-green-500 text-white p-2 w-full mb-2 rounded" onclick="ManageQuiz()">Manage Quiz</button>
        <button class="bg-purple-500 text-white p-2 w-full rounded" onclick="loadScores()">View Scores</button>
    `;
}

function loadTakeQuiz() {
    const container = document.getElementById("main-container");

    if (!quizzes.length) {
        container.innerHTML = `<p class="text-center text-red-500">No quizzes available. Create one first!</p>
            <button class="bg-gray-500 text-white p-2 w-full rounded" onclick="loadHome()">Back</button>`;
        return;
    }

    let quizButtons = quizzes.map((q, index) => {
        return `<button class="bg-green-500 text-white p-2 w-full mb-2 rounded" onclick="chooseMode(${index})">${q.title}</button>`;
    }).join('');

    container.innerHTML = `
        <h2 class="text-lg font-bold mb-4">Select a Quiz</h2>
        ${quizButtons}
        <button class="bg-gray-500 text-white p-2 w-full rounded" onclick="loadHome()">Back</button>
    `;
}

function chooseMode(index) {
    const container = document.getElementById("main-container");
    const quiz = quizzes[index];

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">${quiz.title}</h2>
        <p class="mb-2 text-gray-700">This quiz has <strong>${quiz.questions.length}</strong> questions.</p>
        
        <label for="numQ" class="block mb-2 font-medium">How many questions do you want to attempt?</label>
        <input id="numQ" type="number" 
               min="1" max="${quiz.questions.length}" 
               value="${quiz.questions.length}" 
               class="border p-2 w-full mb-4 rounded shadow">

        <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 w-full mb-2 rounded" 
                onclick="startQuiz(${index})">
            Start Quiz
        </button>
        <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" 
                onclick="loadTakeQuiz()">
            Back
        </button>
    `;
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
            <h2 class="text-2xl font-bold mb-4">${quiz.title}</h2>
            <div class="flex justify-between items-center mb-2">
                <p class="text-gray-700">Question ${currentQ + 1} of ${selectedQuestions.length}</p>
                <p id="timer" class="font-bold text-red-600">${timeLeft}s</p>
            </div>
            <p class="mb-4 text-lg">${q.text}</p>
            <div>
                ${q.options.map((opt, i) => 
                    `<button class="bg-gray-200 hover:bg-gray-300 p-2 w-full mb-2 rounded" 
                             onclick="selectAnswer('${i}', '${q.answer}')">
                        ${String.fromCharCode(65+i)}. ${opt}
                    </button>`
                ).join('')}
            </div>
        `;

        // start timer
        timer = setInterval(() => {
            timeLeft--;
            document.getElementById("timer").textContent = timeLeft + "s";
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
        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">${quiz.title} - Result</h2>
            <p class="mb-4 text-lg">You scored <strong>${score}</strong> / ${selectedQuestions.length}</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 w-full rounded" onclick="loadHome()">
                Back to Home
            </button>
        `;
    }

    loadQuestion();
}

function createQuiz() {
    const title = document.getElementById("quizTitle").value.trim();
    const description = document.getElementById("quizDescription").value.trim();
    
    if (!title) {
        alert("Please enter a quiz title!");
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
        <h2 class="text-2xl font-bold mb-4">Working on: "${currentQuiz.title}"</h2>
        <p class="mb-4 text-gray-700">Questions: ${currentQuestions.length}</p>
        
        <button class="bg-green-600 hover:bg-green-700 text-white p-2 w-full mb-2 rounded" onclick="showAddQuestionForm()">Add Question</button>
        <button class="bg-purple-600 hover:bg-purple-700 text-white p-2 w-full mb-2 rounded" onclick="saveQuiz()">Save Quiz</button>
        <button class="bg-red-600 hover:bg-red-700 text-white p-2 w-full mb-2 rounded" onclick="deleteCurrentQuiz()">Delete Quiz</button>
        ${isEditing ? '' : '<button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="loadCreateQuiz()">Back to Create Menu</button>'}
    `;
}

function loadCreateQuiz() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Create New Quiz</h2>
        <input type="text" id="quizTitle" placeholder="Quiz Title" class="border p-2 w-full mb-4 rounded shadow">
        <input type="text" id="quizDescription" placeholder="Quiz Description" class="border p-2 w-full mb-4 rounded shadow">
        <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 w-full mb-2 rounded" onclick="createQuiz()">Create Quiz</button>
        <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="loadHome()">Back</button>
    `;
}

function showAddQuestionForm() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Add Question to: "${currentQuiz.title}"</h2>
        
        <input type="text" id="questionText" placeholder="Enter your question" class="border p-2 w-full mb-4 rounded shadow">
        <input type="text" id="optionA" placeholder="Option A" class="border p-2 w-full mb-2 rounded shadow">
        <input type="text" id="optionB" placeholder="Option B" class="border p-2 w-full mb-2 rounded shadow">
        <input type="text" id="optionC" placeholder="Option C" class="border p-2 w-full mb-2 rounded shadow">
        <input type="text" id="optionD" placeholder="Option D" class="border p-2 w-full mb-4 rounded shadow">
        
        <label for="correctAnswer" class="block mb-2 font-medium">Correct Answer:</label>
        <select id="correctAnswer" class="border p-2 w-full mb-4 rounded shadow">
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
        </select>
        
        <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 w-full mb-2 rounded" onclick="saveQuestion()">Save Question</button>
        <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="showQuizDashboard()">Cancel</button>
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
        alert("Please fill in all fields!");
        return;
    }
    
    const question = {
        text: text,
        options: [optionA, optionB, optionC, optionD],
        answer: correctAnswer.toString()
    };
    
    currentQuestions.push(question);
    showQuizDashboard();
}

function saveQuiz() {
    if (currentQuestions.length === 0) {
        alert("Please add at least one question before saving!");
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
    
    alert(`Quiz "${currentQuiz.title}" saved successfully!`);
    
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
            <h2 class="text-2xl font-bold mb-4">My Quizzes</h2>
            <p class="text-center text-gray-600 mb-4">No quizzes created yet.</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 w-full rounded" onclick="loadCreateQuiz()">Create Your First Quiz</button>
            <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full mt-2 rounded" onclick="loadHome()">Back to Home</button>
        `;
        return;
    }
    
    let quizList = userQuizzes.map((quiz, index) => `
        <div class="border p-4 mb-4 rounded shadow">
            <h3 class="text-lg font-bold mb-2">${quiz.title}</h3>
            <p class="text-gray-600 mb-2">${quiz.description}</p>
            <p class="text-sm text-gray-500 mb-3">${quiz.questions.length} questions</p>
            <button class="bg-red-600 hover:bg-red-700 text-white p-2 mr-2 rounded" onclick="deleteSavedQuiz(${index})">Delete</button>
            <button class="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded" onclick="editSavedQuiz(${index})">Edit</button>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">My Quizzes (${userQuizzes.length})</h2>
        ${quizList}
        <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="loadHome()">Back to Home</button>
    `;
}

function deleteSavedQuiz(index) {
    const quiz = userQuizzes[index];
    if (confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
        userQuizzes.splice(index, 1);
        localStorage.setItem("quizzes", JSON.stringify(userQuizzes));
        
        // Update the main quizzes array - remove deleted quiz completely
        quizzes = quizzes.filter(q => q !== quiz);
        
        alert(`Quiz "${quiz.title}" deleted successfully!`);
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
            <h2 class="text-2xl font-bold mb-4">Scores</h2>
            <p class="text-gray-600 mb-4">No attempts yet.</p>
            <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="loadHome()">Back</button>
        `;
        return;
    }
    const list = attempts.map(a => {
        const d = new Date(a.date);
        const when = d.toLocaleString();
        return `<div class="border p-3 mb-2 rounded">
            <div class="flex justify-between text-sm text-gray-600">
                <span>${when}</span>
                <span>${a.score} / ${a.total}</span>
            </div>
            <div class="font-medium">${a.title}</div>
        </div>`;
    }).join('');
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Scores (${attempts.length})</h2>
        ${list}
        <button class="bg-red-600 hover:bg-red-700 text-white p-2 w-full mb-2 rounded" onclick="clearScores()">Clear History</button>
        <button class="bg-gray-500 hover:bg-gray-600 text-white p-2 w-full rounded" onclick="loadHome()">Back</button>
    `;
}

function clearScores() {
    if (!confirm('Clear all score history?')) return;
    localStorage.removeItem('scores');
    loadScores();
}