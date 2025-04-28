let stimuli = [];               //刺激
let relations = [];             //関係
let currentQuestionIndex = 0;   //現在の質問項目
let answers = [];               //CSVファイルに送るデータ
let buttonOrderHistory = [];    //ボタンの呈示履歴
let timerInterval;
let startTime;
let timeRecords = []; 
let participantID = '';         //参加者ID
let currentStimulusRow = null;  // 現在のstimulusRowを保持する変数
let usedStimuliIndices = [];    // 使用済みの刺激項目のインデックスを保持する変数
let buttonPosition; // ボタンの位置を記録する変数を宣言

const steps = 16;               //ブロックに含まれる試行数
let currentStep = 0;            //試行数カウンター
let progressBoxesCount = 0;     //進捗ボックスの数


// 表紙 ⇒ 参加者ID入力画面
function showParticipantIDSection() {
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('participant-id-section').classList.remove('hidden');
}

// 参加者ID入力画面 ⇒ 課題説明画面 ＋ 「参加者IDの検証」
function validateParticipantID() {
    participantID = document.getElementById('participant-id-input').value;
    email = document.getElementById('email-input').value;
    age = document.getElementById('age-input').value;
    gender = document.getElementById('gender-input').value;
    
    if (participantID.trim() !== '' && email.trim() !== '' && age.trim() !== '' && gender.trim() !== '') {
        // 参加者IDのみを送信
        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: [{
                    participantID,
                    questionNumber: email,
                    selectedAnswer: age,
                    buttonPosition: gender
                }]
            })
        })
        .then(response => {
            if (response.ok) {
                document.getElementById('participant-id-section').classList.add('hidden');
                document.getElementById('instructions-section').classList.remove('hidden');
            } else {
                showModal('IDの記録に失敗しました。再度お試しください。');
            }
        })
        .catch(error => {
            console.error('Error submitting Participant ID', error);
            showModal('IDの記録に失敗しました。再度お試しください。');
        });
    } else {
        showModal('すべての情報を入力してください。');
    }
}

// 警告メッセージを表示するためのモーダルを作成
function showModal(message) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.onclick = hideModal;

    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `<br><p>${message}</p><br><div class="btn btn-primary" onclick="hideModal()">閉じる</div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// モーダルを非表示にする関数
function hideModal() {
    const modal = document.querySelector('.center-modal');
    const overlay = document.querySelector('.overlay');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

// CSVファイルの読み込みと割当 ほか準備
function loadQuestions() {
    Promise.all([
        fetchCSV('stimulus.csv'),
        fetchCSV('relation.csv')
    ]).then(([loadStimulusCSV, loadRelationCSV]) => {
        stimuli = loadStimulusCSV;
        relations = loadRelationCSV;
        document.getElementById('start-button').disabled = false;
        progressBoxesCount = Math.ceil(relations.length / steps);
        createProgressBoxes(progressBoxesCount);
        updateCounter();
    });
}

// 進捗ボックス
function createProgressBoxes(count) {
    const progressBoxesContainers = document.querySelectorAll('.progress-boxes');
    progressBoxesContainers.forEach(container => {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const box = document.createElement('div');
            box.className = 'progress-box';
            container.appendChild(box);
        }
    });
}

// 課題説明画面 ⇒ RAI-J
function startSurvey() {
    document.getElementById('instruction').innerHTML = '<div class="preparation-screen">+</div>';
    setTimeout(() => {
        document.getElementById('instructions-section').classList.add('hidden');
        document.getElementById('survey-section').classList.remove('hidden');
        showQuestion();
    }, 500);
}

// 課題画面
function showQuestion() {
    if (currentQuestionIndex < relations.length) {
        let randomRowIndex;
        do {
            randomRowIndex = Math.floor(Math.random() * stimuli.length);
        } while (usedStimuliIndices.includes(randomRowIndex));
        
        usedStimuliIndices.push(randomRowIndex);
        currentStimulusRow = shuffle(Object.values(stimuli[randomRowIndex]).slice(1));
        const stimulusMap = {
            1: currentStimulusRow[0],
            2: currentStimulusRow[1],
            3: currentStimulusRow[2],
            4: currentStimulusRow[3],
            5: currentStimulusRow[4]
        };

        const relation = relations[currentQuestionIndex];
        let relationText = '';
        const presentedRelations = [];

        for (let i = 1; i <= 4; i++) {
            if (relation[`Relation_${i}`]) {
                const target1 = stimulusMap[relation[`sti_${i * 2 - 1}`]] || '';
                const target2 = stimulusMap[relation[`sti_${i * 2}`]] || '';
                presentedRelations.push({
                    relation: relation[`Relation_${i}`],
                    target1: target1,
                    target2: target2,
                    div: relation[`div_${i}`],
                    type: relation[`type_${i}`]
                });
                if (relation[`type_${i}`] == 0) {
                    relationText += `<div><span class="stimulus-text">${target1}</span><span class="relational-text"> ${relation[`div_${i}`]} </span><span class="stimulus-text">${target2}</span><span class="relational-text"> ${relation[`Relation_${i}`]}</span></div>`;
                } else if (relation[`type_${i}`] == 1) {
                    relationText += `<div><span class="stimulus-text">${target2}</span><span class="relational-text"> ${relation[`div_${i}`]} </span><span class="stimulus-text">${target1}</span><span class="relational-text"> ${relation[`Relation_${i}`]}</span></div>`;
                } else if (relation[`type_${i}`] == 2) {
                    relationText += `<div><span class="type-N">　</span></div>`;
                } else if (relation[`type_${i}`] == 3) {
                    relationText += `<div><span class="stimulus-text">${target1}</span><span class="relational-text"> が </span><span class="stimulus-text">${target2}</span><span class="relational-text"> ${relation[`div_${i}`]}</span><span class="stimulus-text">${target2}</span><span class="relational-text"> が </span><span class="stimulus-text">${target1}</span><span class="relational-text"> ${relation[`Relation_${i}`]}</span></div>`;
                } else {
                    relationText += `<div>ERROR</div>`;
                }
            }
        }
        document.getElementById('relation-text').innerHTML = relationText.trim();

        const targetQ1 = stimulusMap[relation.sti_q1] || '';
        const targetQ2 = stimulusMap[relation.sti_q2] || '';
        let questionText = `<span class="questionText">${targetQ1}</span> ${relation.div_q} <span class="questionText">${targetQ2}</span> ${relation.Question_1}`;

        if (relation.Question_2) {
            const targetQ3 = stimulusMap[relation.sti_q3] || '';
            const targetQ4 = stimulusMap[relation.sti_q4] || '';
            questionText += `<br><span class="questionText">${targetQ3}</span> ${relation.div_q2} <span class="questionText">${targetQ4}</span> ${relation.Question_2}`;
        }
        
        document.getElementById('question-text').innerHTML = questionText;

        randomizeButtonOrder();
        updateCounter();
        updateCounterColor();
        updateProgressBoxes();

        logProgress();

        startTimer();
    } else {
        endSurvey();  // 終了時の処理を endSurvey 関数に移動
    }
}

// 進捗状況の送信 エラー処理を入れていない
function logProgress() {
    fetch('/logProgress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentQuestionIndex })
    })
    .catch(error => {console.error("未接続状態:", error)})
}

// 終了時の処理
function endSurvey() {
    document.getElementById('survey-section').classList.add('hidden');
    document.getElementById('thank-you-section').classList.remove('hidden');
    console.log("回答:", answers);
    console.log("時間記録:", timeRecords);
    updateProgressBoxes();

    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answers,
            relations
        })
    })
    .then(response => {
        if (response.ok) {
            console.log('Data successfully submitted');
            document.getElementById('error-button-container').classList.add('hidden');
        } else {
            console.error('Error in data submission');
            showRetryButtons();
        }
    })
    .catch(error => {
        console.error('Error in data submission', error);
        showRetryButtons();
    });
}

// 再送信ボタンとCSVダウンロードボタンの表示
function showRetryButtons() {
    document.getElementById('error-button-container').classList.remove('hidden');
}

// 再送信処理
function retrySubmission() {
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answers,
            relations
        })
    })
    .then(response => {
        if (response.ok) {
            console.log('Data successfully resubmitted');
            document.getElementById('error-button-container').classList.add('hidden');
        } else {
            console.error('Error in data resubmission');
        }
    })
    .catch(error => {
        console.error('Error in data resubmission', error);
    });
}

// CSVダウンロード処理
function downloadCSV() {
    const csvData = answers.map(answer => ({
        participantID: answer.participantID,
        questionNumber: answer.questionNumber,
        selectedAnswer: answer.selectedAnswer,
        buttonPosition: answer.buttonPosition,
        elapsedTime: answer.elapsedTime,
        presentedRelations: answer.presentedRelations.map(relation => 
            `${relation.target1} ${relation.div} ${relation.target2} ${relation.relation}`
        ).join(' | '),
        questionText: answer.questionText,
    }));

    const csvContent = Papa.unparse(csvData);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'RAI-ja_results.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// タイマーの開始
function startTimer() {
    const timerElement = document.getElementById('timer');
    let timeLeft = 30; // 制限時間を設定

    timerElement.textContent = timeLeft.toString().padStart(2, '0');
    startTime = Date.now();

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerElement.textContent = timeLeft.toString().padStart(2, '0');

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // document.getElementById('relation-text').innerHTML = '<span class="Relational-timeout">時間切れ</span>';
            // document.getElementById('question-text').innerHTML = '<span class="Question-timeout">5秒後に次に進みます</span>';
            document.getElementById('button-left').innerHTML = '';
            document.getElementById('button-right').innerHTML = '';
            setTimeout(() => {
                submitAnswer('時間切れ');
            }, 0); // ms後に次の質問を呈示 現在は表示せず0ms コメントアウト部分がタイムアウト表示
        }
    }, 1000);
}

// 選択肢ボタンの無作為化 ＋ 4回連続同じ配置にならない構成
function randomizeButtonOrder() {
    const buttonLeft = document.getElementById('button-left');
    const buttonRight = document.getElementById('button-right');
    buttonLeft.innerHTML = '';
    buttonRight.innerHTML = '';

    const yesButton = document.createElement('button');
    yesButton.type = 'button';
    yesButton.className = 'btn btn-success';
    yesButton.textContent = 'はい';

    const noButton = document.createElement('button');
    noButton.type = 'button';
    noButton.className = 'btn btn-danger';
    noButton.textContent = 'いいえ';

    if (buttonOrderHistory.length >= 3 && buttonOrderHistory.slice(-3).every(order => order === buttonOrderHistory[buttonOrderHistory.length - 1])) {
        if (buttonOrderHistory[buttonOrderHistory.length - 1] === 'yes-left') {
            buttonLeft.appendChild(noButton);
            buttonRight.appendChild(yesButton);
            noButton.onclick = () => {
                buttonPosition = 'left';
                submitAnswer('いいえ');
            };
            yesButton.onclick = () => {
                buttonPosition = 'right';
                submitAnswer('はい');
            };
            buttonOrderHistory.push('yes-right');
        } else {
            buttonLeft.appendChild(yesButton);
            buttonRight.appendChild(noButton);
            yesButton.onclick = () => {
                buttonPosition = 'left';
                submitAnswer('はい');
            };
            noButton.onclick = () => {
                buttonPosition = 'right';
                submitAnswer('いいえ');
            };
            buttonOrderHistory.push('yes-left');
        }
    } else {
        if (Math.random() > 0.5) {
            buttonLeft.appendChild(yesButton);
            buttonRight.appendChild(noButton);
            yesButton.onclick = () => {
                buttonPosition = 'left';
                submitAnswer('はい');
            };
            noButton.onclick = () => {
                buttonPosition = 'right';
                submitAnswer('いいえ');
            };
            buttonOrderHistory.push('yes-left');
        } else {
            buttonLeft.appendChild(noButton);
            buttonRight.appendChild(yesButton);
            noButton.onclick = () => {
                buttonPosition = 'left';
                submitAnswer('いいえ');
            };
            yesButton.onclick = () => {
                buttonPosition = 'right';
                submitAnswer('はい');
            };
            buttonOrderHistory.push('yes-right');
        }
    }

    if (buttonOrderHistory.length > 4) { 
        buttonOrderHistory.shift();
    }
}

// anaswerで「はい」「いいえ」「時間切れ」を受け取る ＋ 回答時のデータを記録
function submitAnswer(answer) {
    stopTimer();
    const relation = relations[currentQuestionIndex];
    const stimulusMap = {
        1: currentStimulusRow[0], 
        2: currentStimulusRow[1],
        3: currentStimulusRow[2],
        4: currentStimulusRow[3],
        5: currentStimulusRow[4]
    };
    
    const presentedRelations = [];
    for (let i = 1; i <= 4; i++) {
        if (relation[`Relation_${i}`] === 'N') {
            continue;  // relation_Xに'N'が入っている場合、ループを飛ばす
        }
        if (relation[`Relation_${i}`]) {
            const target1 = stimulusMap[relation[`sti_${i * 2 - 1}`]] || '';
            const target2 = stimulusMap[relation[`sti_${i * 2}`]] || '';
            presentedRelations.push({
                relation: relation[`Relation_${i}`],
                target1: target1,
                target2: target2,
                div: relation[`div_${i}`],
                type: relation[`type_${i}`]
            });
        }
    }
    
    const targetQ1 = stimulusMap[relation.sti_q1] || '';
    const targetQ2 = stimulusMap[relation.sti_q2] || '';
    let questionText = `${targetQ1} ${relation.div_q} ${targetQ2} ${relation.Question_1}`;

    if (relation.Question_2) {
        const targetQ3 = stimulusMap[relation.sti_q3] || '';
        const targetQ4 = stimulusMap[relation.sti_q4] || '';
        questionText += `${targetQ3} ${relation.div_q2} ${targetQ4} ${relation.Question_2}`;
    }

    const elapsedTime = timeRecords[timeRecords.length - 1].time;

    answers.push({
        participantID: participantID,
        questionNumber: currentQuestionIndex + 1,
        presentedRelations: presentedRelations,
        questionText: questionText,
        selectedAnswer: answer,
        buttonPosition: buttonPosition,
        elapsedTime: elapsedTime
    });

    // 質問の準備画面を表示
    document.getElementById('question-text').innerHTML = '<div class="preparation-screen">+</div>';
    document.getElementById('relation-text').innerHTML = '';
    document.getElementById('button-left').innerHTML = '';
    document.getElementById('button-right').innerHTML = '';

    setTimeout(() => {
        // 質問の準備画面を削除し、次の質問を表示
        document.getElementById('question-text').innerHTML = '';
        currentQuestionIndex++;
        showQuestion();
    }, 500);
}

// タイマーの記録
function stopTimer() {
    clearInterval(timerInterval);
    const elapsedTime = (Date.now() - startTime) / 1000;
    timeRecords.push({ questionIndex: currentQuestionIndex, time: elapsedTime });
}

function updateCounter() {
    const counterElement = document.getElementById('counter');
    const maxDigits = relations.length.toString().length;
    const currentQuestionNumber = (currentQuestionIndex + 1).toString().padStart(maxDigits, '0');
    counterElement.textContent = `${currentQuestionNumber}/${relations.length}`;
}

function updateCounterColor() {
    const counterCard = document.getElementById('counter-card');
    const percentage = (currentStep / (steps - 1)) * 100;
    counterCard.style.background = `linear-gradient(to top, rgb(0, 140, 255) ${percentage}%, rgb(255, 190, 70) ${percentage}%)`;

    currentStep++;
    if (currentStep >= steps) {
        currentStep = 0;
    }
}

function updateProgressBoxes() {
    const progressBoxesSurvey = document.querySelectorAll('#progress-boxes-survey .progress-box');
    const progressBoxesThankYou = document.querySelectorAll('#progress-boxes-thank-you .progress-box');
    const completedBoxes = Math.floor(currentQuestionIndex / steps);
    for (let i = 0; i < progressBoxesSurvey.length; i++) {
        if (i < completedBoxes) {
            progressBoxesSurvey[i].style.backgroundColor = 'rgb(0, 140, 255)';
            if (progressBoxesThankYou[i]) {
                progressBoxesThankYou[i].style.backgroundColor = 'rgb(0, 140, 255)';
            }
        } else {
            progressBoxesSurvey[i].style.backgroundColor = 'rgb(255, 190, 70)';
            if (progressBoxesThankYou[i]) {
                progressBoxesThankYou[i].style.backgroundColor = 'rgb(255, 190, 70)';
            }
        }
    }
}

// CSVの読み込み
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

// 無作為化
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', loadQuestions);
