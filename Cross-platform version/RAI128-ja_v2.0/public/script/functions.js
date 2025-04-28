import { ITI } from './config.js';
import { state } from './state.js';
import * as ui from './uiTools.js';

function fetchCSV(url) { // CSV読込
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: function(results) { resolve(results.data) },
            error: function(error) { reject(error) }
        });
    });
};

function shuffle(array) { // 配列シャッフル
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

function logProgress() { // 進捗状況の送信 (エラー処理を入れていない)
    fetch('/logProgress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id:                   state.id,
            currentQuestionIndex: state.currentQuestionIndex
        })
    })
    .catch(error => {console.error("未接続状態:", error)})
};

function randomizeButtonOrder() { // 選択肢ボタンの無作為化 ＋ 4回連続同じ配置にならない構成
    const yesButton = document.createElement('button');
    yesButton.className = 'btn btn-success';
    yesButton.textContent = 'はい';
    const noButton = document.createElement('button');
    noButton.className = 'btn btn-danger';
    noButton.textContent = 'いいえ';

    function yesLeft() {
        state.btnHistory.push('yes-left');
        document.getElementById('button-left').appendChild(yesButton);
        yesButton.onclick = () => { state.buttonPosition = 'left', submitAnswer('はい') };
        document.getElementById('button-right').appendChild(noButton);
        noButton.onclick = () => { state.buttonPosition = 'right', submitAnswer('いいえ') };
    };
    function yesRight() {
        state.btnHistory.push('yes-right');
        document.getElementById('button-left').appendChild(noButton);
        noButton.onclick = () => { state.buttonPosition = 'left', submitAnswer('いいえ') };
        document.getElementById('button-right').appendChild(yesButton);
        yesButton.onclick = () => { state.buttonPosition = 'right', submitAnswer('はい') };
    }

    // 4連続同じ配置にならないための工夫 (改善の余地あり)
    if (state.btnHistory.length >= 3 && state.btnHistory.slice(-3).every(order => order === state.btnHistory[state.btnHistory.length - 1])) {
        if (state.btnHistory[state.btnHistory.length - 1] === 'yes-left') { yesRight() } else { yesLeft() }
    } else { if (Math.random() > 0.5) { yesLeft() } else { yesRight() } };
    if (state.btnHistory.length >= 4) { state.btnHistory.shift() }
};

function submitAnswer(answer) { // 回答時のデータを記録
    ui.timer.stop();
    const relation = state.relations[state.currentQuestionIndex];
    const stimulusMap = {
        1: state.currentStimulusRow[0], 
        2: state.currentStimulusRow[1],
        3: state.currentStimulusRow[2],
        4: state.currentStimulusRow[3],
        5: state.currentStimulusRow[4]
    };

    const presentedRelations = [];
    for (let i = 1; i <= 4; i++) {
        if (relation[`Relation_${i}`] === 'N') { continue };  // relation_Xに'N'が入っている場合、ループを飛ばす
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

    // QuestionText(); でなんとかできる
    const targetQ1 = stimulusMap[relation.sti_q1] || '';
    const targetQ2 = stimulusMap[relation.sti_q2] || '';
    let questionText = `${targetQ1} ${relation.div_q} ${targetQ2} ${relation.Question_1}`;

    if (relation.Question_2) {
        const targetQ3 = stimulusMap[relation.sti_q3] || '';
        const targetQ4 = stimulusMap[relation.sti_q4] || '';
        questionText += `${targetQ3} ${relation.div_q2} ${targetQ4} ${relation.Question_2}`;
    }

    let responseTime = state.timeRecords[state.timeRecords.length - 1].time;

    state.answers.push({
        id:     state.id,
        email:  state.email,
        age:    state.age,
        gender: state.gender,
        questionNumber: state.currentQuestionIndex + 1,
        presentedRelations: presentedRelations,
        questionText  : questionText,
        selectedAnswer: answer,
        buttonPosition: state.buttonPosition,
        responseTime  : responseTime
    });

    // 質問の準備画面を表示
    document.getElementById('question-text').innerHTML = '<div class="preparation-screen">+</div>';
    document.getElementById('relation-text').innerHTML = '';
    document.getElementById('button-left').innerHTML = '';
    document.getElementById('button-right').innerHTML = '';

    setTimeout(() => { // 質問の準備画面を削除し、次の質問を表示
        document.getElementById('question-text').innerHTML = '';
        state.currentQuestionIndex++;
        showQuestion();
    }, ITI); // 試行間間隔
};

function endTask() {
    loadView('./view/99.end.html', '#mainContent', () => {
        console.log("回答:", state.answers);
        console.log("時間記録:", state.timeRecords);

        fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: state.answers,
                relations: state.relations
            })
        })
        .then(response => {
            if (response.ok) {
                console.log("The experiment is over.");
            } else {
                ui.retryButtons.show();
            }
        })
        .catch(() => {
            ui.retryButtons.show();
        });
    });
}


function showQuestion() { // RAI-Jの課題内容
    if (state.currentQuestionIndex < state.relations.length) {
        let randomRowIndex;
        do { randomRowIndex = Math.floor(Math.random() * state.stimuli.length);
        } while ( state.usedStimuliIndices.includes(randomRowIndex) ); // 記録したことのある番号を持ってくると再抽選になっているので注意 (項目数が増えるとバグる)

        state.usedStimuliIndices.push(randomRowIndex);
        state.currentStimulusRow = shuffle(Object.values(state.stimuli[randomRowIndex]).slice(1));
        const stimulusMap = {
            1: state.currentStimulusRow[0],
            2: state.currentStimulusRow[1],
            3: state.currentStimulusRow[2],
            4: state.currentStimulusRow[3],
            5: state.currentStimulusRow[4]
        };

        const relation = state.relations[state.currentQuestionIndex]; // 刺激の読み込み，命題と質問の生成
        let relationText = '';
        for (let i = 1; i <= 4; i++) {
            if (relation[`Relation_${i}`]) {
                const target1 = stimulusMap[relation[`sti_${i * 2 - 1}`]] || '';
                const target2 = stimulusMap[relation[`sti_${i * 2}`]] || '';
                const type    = relation[`type_${i}`];
                const divText = relation[`div_${i}`];
                const relText = relation[`Relation_${i}`];
                relationText += ui.create.RelationText(type, target1, target2, divText, relText);
            }
        }
        let questionText = ui.create.QuestionText(stimulusMap, relation);

        document.getElementById('relation-text').innerHTML = relationText;
        document.getElementById('question-text').innerHTML = questionText;

        randomizeButtonOrder();
        ui.update.CounterNumber();
        ui.update.CounterColor();
        ui.update.ProgressBoxes();
        ui.timer.start();
        logProgress();
    } else {
        ui.update.ProgressBoxes(); // 全試行終了時に進捗BOX更新
        endTask();  // 終了時の処理
    }
};

function loadView(viewPath, targetSelector = '#mainContent', onLoad = null) {
    if (!viewPath || !targetSelector) return;

    fetch(viewPath)
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector(targetSelector);
            const current = document.querySelector(targetSelector);
            if (newContent && current) {
                current.replaceWith(newContent);
                if (typeof onLoad === 'function') {
                onLoad(); // ← 差し替え後に初期化処理を実行！
            }
        }
    });
}

export {
    fetchCSV,
    shuffle,
    logProgress,
    randomizeButtonOrder,
    submitAnswer,
    endTask,
    showQuestion,
    loadView
};