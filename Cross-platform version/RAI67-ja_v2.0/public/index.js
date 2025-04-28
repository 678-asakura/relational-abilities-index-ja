import { ITI, STEP_LIST, state, fn, ui } from './script/api.js'

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest('[data-fn]');
    if (!el) return;
    const action = el.dataset.fn;

    switch (action) {
      case 'loadView': {
        const viewPath = el.dataset.view;
        const targetSelector = el.dataset.target || '#mainContent';
        fn.loadView(viewPath, targetSelector);
        break;
      }

      case 'sendInfo': {
        state.id     = document.getElementById('ID-input')?.value || '';
        state.email  = document.getElementById('email-input')?.value || '';
        state.age    = document.getElementById('age-input')?.value || '';
        state.gender = document.getElementById('gender-input')?.value || '';

        // 未入力チェック
        if (state.id.trim() && state.email.trim() && state.age.trim() && state.gender.trim()) {
          fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: [state] })
          })
          .then(response => {
            if (response.ok) {
              const viewPath = el.dataset.view;
              const targetSelector = el.dataset.target || '#mainContent';

              fn.loadView(viewPath, targetSelector, () => {
                const startBtn = document.getElementById('exp-start');
                if (startBtn) {
                  Promise.all([
                    fn.fetchCSV('./src/stimulus.csv'),
                    fn.fetchCSV('./src/relation.csv')
                  ]).then(([loadStimulusCSV, loadRelationCSV]) => {
                    state.stimuli = loadStimulusCSV;
                    state.relations = loadRelationCSV;

                    state.progressBoxesCount = STEP_LIST.length;
                    startBtn.disabled = false;
                  }).catch(err => {
                    console.error('CSV読み込みエラー:', err);
                    ui.modal?.show?.('課題の準備に失敗しました。再度お試しください。');
                  });
                }
              });
            }
          })
          .catch(() => {
            ui.modal?.show?.('IDの記録に失敗しました。再度お試しください。');
          });
        } else {
          ui.modal?.show?.('すべての情報を入力してください。');
        }
        break;
      }

      case 'startExp': {
        const viewPath = el.dataset.view;
        const targetSelector = el.dataset.target || '#mainContent';
        fn.loadView(viewPath, targetSelector, () => {
          ui.update.CounterNumber();
          document.getElementById('question-text').innerHTML = '<div class="preparation-screen">+</div>';
          setTimeout(() => {
            document.getElementById('timer-card')?.classList.remove('d-none');
            document.getElementById('counter-card')?.classList.remove('d-none');
            ui.create.ProgressBoxes(state.progressBoxesCount);
            fn.showQuestion();
          }, ITI);    

        });
        break;
      }

      case 'retrySubmission': {
        fetch('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: state.answers,
            relations: state.relations
          })
        })
        .then(response => {
          if (response.ok) ui.retryButtons.hide();
          else console.error('Error in data resubmission');
        })
        .catch(error => {
          console.error('Error in data resubmission');
        });
        break;
      }

      case 'downloadCSV': {
        const csvData = state.answers.map(answer => ({
          id: answer.id,
          email: answer.email,
          age: answer.age,
          gender: answer.gender,
          questionNumber: answer.questionNumber,
          selectedAnswer: answer.selectedAnswer,
          buttonPosition: answer.buttonPosition,
          responseTime: answer.responseTime,
          presentedRelations: answer.presentedRelations?.map(relation =>
            `${relation.target1} ${relation.div} ${relation.target2} ${relation.relation}`
          ).join(' | '),
          questionText: answer.questionText,
        }));

        const csvContent = Papa.unparse(csvData);
        const bom = '\uFEFF'; // BOM追加
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'RAI-ja_results.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      default:
        console.warn(`未定義の data-fn: ${fn}`);
    }
  });
});


