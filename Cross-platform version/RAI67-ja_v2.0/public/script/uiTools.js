import { TIME_LIMIT, TIMEOUT_SETTING, STEP_LIST } from './config.js';
import { state } from './state.js';
import { submitAnswer } from './functions.js';


const modal = {
    show(message) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.onclick = () => modal.hide();

        const modalBox = document.createElement('div');
        modalBox.className = 'center-modal';
        modalBox.innerHTML = `
            <br><p>${message}</p><br>
            <div class="btn btn-primary" id="modal-close-button">閉じる</div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modalBox);

        const closeBtn = document.getElementById('modal-close-button');
        if (closeBtn) {
            closeBtn.onclick = () => modal.hide();
        }
    },

    hide() {
        const modalBox = document.querySelector('.center-modal');
        const overlay = document.querySelector('.overlay');
        if (modalBox) modalBox.remove();
        if (overlay) overlay.remove();
    }
};

const create = { // HTMLにないものを作る系
    ProgressBoxes(count) {
        const progressBoxesContainers = document.querySelectorAll('.progress-boxes');
        progressBoxesContainers.forEach(container => {
            for (let i = 0; i < count; i++) {
                const box = document.createElement('div');
                box.className = 'progress-box';
                container.appendChild(box);
            }
        });
    },
    RelationText(type, target1, target2, divText, relationText) {
        let result = '';
        if (type == 0) {
            result = `<div><span class="stimulus-text">${target1}</span><span class="relational-text"> ${divText} </span><span class="stimulus-text">${target2}</span><span class="relational-text"> ${relationText}</span></div>`;
        } else if (type == 1) {
            result = `<div><span class="stimulus-text">${target2}</span><span class="relational-text"> ${divText} </span><span class="stimulus-text">${target1}</span><span class="relational-text"> ${relationText}</span></div>`;
        } else if (type == 2) {
            result = `<div><span class="type-N">　</span></div>`;
        } else if (type == 3) {
            result = `<div><span class="stimulus-text">${target1}</span><span class="relational-text"> が </span><span class="stimulus-text">${target2}</span><span class="relational-text"> ${divText}</span><span class="stimulus-text">${target2}</span><span class="relational-text"> が </span><span class="stimulus-text">${target1}</span><span class="relational-text"> ${relationText}</span></div>`;
        } else {
            result = `<div>ERROR</div>`;
        }
        return result;
    },
    QuestionText(stimulusMap, relation) {
        const targetQ1 = stimulusMap[relation.sti_q1] || '';
        const targetQ2 = stimulusMap[relation.sti_q2] || '';
        let questionText = `<span class="questionText">${targetQ1}</span> ${relation.div_q} <span class="questionText">${targetQ2}</span> ${relation.Question_1}`;
        if (relation.Question_2) {
            const targetQ3 = stimulusMap[relation.sti_q3] || '';
            const targetQ4 = stimulusMap[relation.sti_q4] || '';
            questionText += `<br><span class="questionText">${targetQ3}</span> ${relation.div_q2} <span class="questionText">${targetQ4}</span> ${relation.Question_2}`;
        }
        return questionText;
    }
};

const update = { // 進捗更新
    CounterNumber() {
        const counterElement = document.getElementById('counter');
        const maxDigits = state.relations.length.toString().length;
        const currentQuestionNumber = (state.currentQuestionIndex + 1).toString().padStart(maxDigits, '0');
        counterElement.textContent = `${currentQuestionNumber}/${state.relations.length}`;
    },
    CounterColor() {
        const counterCard = document.getElementById('counter-card');
        const steps = STEP_LIST[state.currentStepIndex];
        const percentage = (state.currentStep / (steps - 1)) * 100;
        counterCard.style.background = `linear-gradient(to top, rgb(0, 140, 255) ${percentage}%, rgb(255, 190, 70) ${percentage}%)`;

        state.currentStep++;
        if (state.currentStep >= steps) {
            state.currentStep = 0;
            state.currentStepIndex++;
            if (state.currentStepIndex >= STEP_LIST.length) {
                state.currentStepIndex = STEP_LIST.length - 1; // 最後のステップに留まる
            }
        }
    },
    ProgressBoxes() {
        const progressBoxesSurvey = document.querySelectorAll('#progress-boxes-survey .progress-box');
        const progressBoxesThankYou = document.querySelectorAll('#progress-boxes-thank-you .progress-box');
        let completedBoxes = 0;
        let questionsCovered = 0;

        for (let i = 0; i < STEP_LIST.length; i++) {
            questionsCovered += STEP_LIST[i];
            if (state.currentQuestionIndex >= questionsCovered) {
                completedBoxes++;
            }
        }

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
};

const timer = { // タイマー
    start() {
        let timeLeft = TIME_LIMIT;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = timeLeft.toString().padStart(2, '0');
        this.startTime = Date.now();
        this.interval = setInterval(() => { 
            timeLeft -= 1;
            timerElement.textContent = timeLeft.toString().padStart(2, '0');
            if (timeLeft <= 0) {
                if (TIMEOUT_SETTING === "on") {
                    document.getElementById('relation-text').innerHTML = '<span class="Relational-timeout">時間切れ</span>';
                    document.getElementById('question-text').innerHTML = '<span class="Question-timeout">5秒後に次に進みます</span>';
                    document.getElementById('button-left').innerHTML = '';
                    document.getElementById('button-right').innerHTML = '';
                    state.timeOut = 5000; // 5秒間のタイムアウト
                }
                clearInterval(this.interval);
                setTimeout(() => { submitAnswer('時間切れ') }, state.timeOut);
            }
        }, 1000);
    },
    stop() {
        clearInterval(this.interval);
        let responseTime = (Date.now() - this.startTime) / 1000;
        state.timeRecords.push({ questionIndex: state.currentQuestionIndex, time: responseTime });
    }
};

const retryButtons = { // 保存失敗時のボタン表示 (showは実質的に機能していない: しなくても問題ない)
    show() { document.getElementById('error-button-container').classList.remove('d-none') },
    hide() { document.getElementById('error-button-container').classList.add('d-none') }
};

export {
    modal,
    create,
    update,
    timer,
    retryButtons
};