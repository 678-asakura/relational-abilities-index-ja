const express = require('express');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = 8000;

app.use(express.static('public')); 
app.use(express.json({ limit: '1mb' })); 
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const writeQueue = {};
const csvHeader = [
    {id: 'id',                 title: 'ID'},
    {id: 'email',              title: 'email'},
    {id: 'age',                title: 'age'},
    {id: 'gender',             title: 'gender'},
    {id: 'questionNumber',     title: 'Q_Num'},
    {id: 'selectedAnswer',     title: 'Answer'},
    {id: 'buttonPosition',     title: 'Btn_Posi'},
    {id: 'responseTime',       title: 'Time (s)'},
    {id: 'presentedRelations', title: 'Relations'},
    {id: 'questionText',       title: 'Question'},
];

async function writeCSVSequential(filePath, records) {
    if (!writeQueue[filePath]) {
        writeQueue[filePath] = Promise.resolve();
    }

    writeQueue[filePath] = writeQueue[filePath].then(async () => {
        const csvWriter = fs.existsSync(filePath)
            ? createCsvWriter({ path: filePath, header: csvHeader, append: true })
            : createCsvWriter({ path: filePath, header: csvHeader, append: false });

        await csvWriter.writeRecords(records);

        // BOM付与もこの中でやる（安全！）
        await addBOMToCSV(filePath);
    });

    return writeQueue[filePath];
}

async function addBOMToCSV(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    const bom = '\ufeff';
    const csvWithBom = bom + data;
    await fs.promises.writeFile(filePath, csvWithBom, 'utf8');
    console.log('BOM added to the CSV file');
}

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
            id: answer.id,
            email: answer.email,
            age: answer.age,
            gender: answer.gender,
            questionNumber: answer.questionNumber || '',
            selectedAnswer: answer.selectedAnswer || '',
            buttonPosition: answer.buttonPosition || '',
            responseTime: answer.responseTime ? answer.responseTime.toFixed(3) : '',
            presentedRelations: presentedRelations,
            questionText: answer.questionText || '',
        };
    });

    const filePath = path.join(__dirname, 'public', 'RAI-ja_results.csv');

    writeCSVSequential(filePath, records)
        .then(() => {
            console.log('The CSV file was written successfully');
            res.sendStatus(200);
        })
        .catch(error => {
            console.error('Error writing CSV file', error);
            res.sendStatus(500);
        });
});

// 追加log報告
app.post('/logProgress', (req, res) => {
    const { id, currentQuestionIndex } = req.body; // ← idも受け取る
    const currentTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`[${currentTime}] ID: ${id} | Current Question Index: ${currentQuestionIndex + 1}`);
    res.sendStatus(200);
});