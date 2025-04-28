export const state = {
    // 刺激・課題状態
    stimuli:   [],                // 刺激
    relations: [],                // 関係
    currentQuestionIndex: 0,      // 現在の質問項目
    currentBlockTrial: 0,         // ブロック内の試行数カウンター
    timeOut: 0,                   // タイムアウト時間
    timeRecords: [],              // 反応時間の記録
    progressBoxesCount: 0,        // 進捗ボックスの数

    // 参加者情報
    id:     '',                   // ID
    email:  '',
    age:    '',
    gender: '',

    // 実行中の状態管理
    buttonPosition: '',           // ボタン位置
    answers: [],                  // 回答データ
    btnHistory: [],               // ボタンの呈示履歴
    currentStimulusRow: null,     // 現在のstimulusRow
    usedStimuliIndices: []        // 使用済みインデックス
};