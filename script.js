let userQuizzes = JSON.parse(localStorage.getItem("quizzes")) || [];
let quizzes = []; // final array for display

fetch('builtin_quizzes.json')
    .then(res => res.json())
    .then(data => {
        quizzes = [...data, ...userQuizzes]; // merge builtin + user quizzes
        loadHome(); // render Home Screen after loading quizzes
    })
    .catch(err => {
        console.error("Error loading builtin quizzes:", err);
        quizzes = [...userQuizzes]; // fallback to user quizzes only
        loadHome();
    });
loadHome();

function loadHome() {
    const container = document.getElementById("main-container");
    container.innerHTML = `
        <button class="bg-blue-500 text-white p-2 w-full mb-2 rounded" onclick="loadCreateQuiz()">Create Quiz</button>
        <button class="bg-green-500 text-white p-2 w-full mb-2 rounded" onclick="loadTakeQuiz()">Take Quiz</button>
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