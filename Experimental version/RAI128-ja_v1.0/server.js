const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, 'public'))); // 静的ファイルの提供

app.use(bodyParser.json({ limit: '1mb' })); // JSONペイロードサイズの上限を1MBに設定
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const csvWriterAppend = createCsvWriter({
    path: 'public/RAI-ja_results.csv',
    header: [
        {id: 'participantID',      title: 'ID'},
        {id: 'questionNumber',     title: 'Q_Num'},
        {id: 'selectedAnswer',     title: 'Answer'},
        {id: 'buttonPosition',     title: 'Btn_Posi'},
        {id: 'elapsedTime',        title: 'Time (s)'},
        {id: 'presentedRelations', title: 'Relations'},
        {id: 'questionText',       title: 'Question'},
    ],
    append: true
});

const csvWriterNew = createCsvWriter({
    path: 'public/RAI-ja_results.csv',
    header: [
        {id: 'participantID',      title: 'ID'},
        {id: 'questionNumber',     title: 'Q_Num'},
        {id: 'selectedAnswer',     title: 'Answer'},
        {id: 'buttonPosition',     title: 'Btn_Posi'},
        {id: 'elapsedTime',        title: 'Time (s)'},
        {id: 'presentedRelations', title: 'Relations'},
        {id: 'questionText',       title: 'Question'},
    ],
    append: false
});

app.post('/submit', (req, res) => {
    const { answers } = req.body;

    const records = answers.map((answer) => {
        const presentedRelations = answer.presentedRelations ? answer.presentedRelations.map(relation => {
            if (relation.type == 3) {
                return `${relation.target1} が ${relation.target2} ${relation.div} ${relation.target2} が ${relation.target1} ${relation.relation}`;
            } else {
                return `${relation.target1} ${relation.div} ${relation.target2} ${relation.relation}`;
            }
        }).join(' | ') : '';

        return {
            participantID: answer.participantID,
            questionNumber: answer.questionNumber || '',
            selectedAnswer: answer.selectedAnswer || '',
            buttonPosition: answer.buttonPosition || '',
            elapsedTime: answer.elapsedTime ? answer.elapsedTime.toFixed(3) : '',
            presentedRelations: presentedRelations,
            questionText: answer.questionText || '',
        };
    });

    const filePath = path.join(__dirname, 'public', 'RAI-ja_results.csv');
    const csvWriter = fs.existsSync(filePath) ? csvWriterAppend : csvWriterNew;

    csvWriter.writeRecords(records)
        .then(() => {
            console.log('The CSV file was written successfully');
            addBOMToCSV(filePath, res);
        })
        .catch(error => {
            console.error('Error writing CSV file', error);
            res.sendStatus(500);
        });
});

function addBOMToCSV(filePath, res) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        const bom = '\ufeff';
        const csvWithBom = bom + data;
        fs.writeFile(filePath, csvWithBom, 'utf8', (err) => {
            if (err) throw err;
            console.log('BOM added to the CSV file');
            res.sendStatus(200);
        });
    });
}

// 追加log報告
app.post('/logProgress', (req, res) => {
    const { currentQuestionIndex } = req.body;
    const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // 現在の時間、分、秒を取得
    console.log(`[${currentTime}] Current Question Index: ${currentQuestionIndex}`);
    res.sendStatus(200);
});