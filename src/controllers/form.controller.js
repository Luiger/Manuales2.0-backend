const sheetsService = require('../services/sheets.service');

const getQuestions = async (req, res) => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME;

  if (!spreadsheetId || !sheetName) {
    return res.status(400).json({ error: 'SPREADSHEET_ID and SHEET_NAME must be defined in .env' });
  }

  const data = await sheetsService.getSheetData(spreadsheetId, sheetName);

  if (data && data.length > 0) {
    const questions = data[0];
    res.json({ questions });
  } else {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

const submitAnswers = async (req, res) => {
  const { answers } = req.body;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME;

  if (!spreadsheetId || !sheetName || !answers) {
    return res.status(400).json({ error: 'SPREADSHEET_ID and SHEET_NAME must be defined in .env, and answers are required' });
  }

  const success = await sheetsService.appendSheetData(spreadsheetId, sheetName, answers);

  if (success) {
    res.json({ message: 'Answers submitted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to submit answers' });
  }
};

module.exports = {
  getQuestions,
  submitAnswers,
};
