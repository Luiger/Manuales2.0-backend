// Import necessary modules and services
const { findUserByEmail, updateCell, appendSheetData } = require('./sheets.service'); // Assuming sheets.service is in the same directory
const crypto = require('crypto'); // For generating unique IDs if needed

/**
 * Submits form data to a specified Google Sheet.
 * This function is designed to be reusable for different forms.
 *
 * @param {string} spreadsheetId - The ID of the Google Sheet.
 * @param {string} sheetName - The name of the sheet within the spreadsheet.
 * @param {object} formData - An object containing the form data, where keys are field names and values are the data.
 * @param {string} uniqueIdentifierField - The name of the field to use as a unique identifier for finding rows (e.g., 'email', 'Marca temporal').
 * @param {Array<{name: string, type: string}>} formDefinition - An array of objects defining each field's name and type.
 * @returns {Promise<boolean>} - True if the operation was successful, false otherwise.
 */
const submitForm = async (spreadsheetId, sheetName, formData, uniqueIdentifierField, formDefinition) => {
  try {
    // --- Determine the unique identifier value ---
    const identifierValue = formData[uniqueIdentifierField];
    if (!identifierValue) {
      console.error(`Error: Unique identifier field "${uniqueIdentifierField}" not found in formData.`);
      return false;
    }

    // --- Pre-process formData to handle 'Marca temporal' ---
    // If 'Marca temporal' is not provided, automatically add the current date and time.
    if (!formData['Marca temporal']) {
      formData['Marca temporal'] = new Date().toISOString();
    }

    // --- Map form definition to column headers and data ---
    const sheetHeaders = formDefinition.map(field => field.name);
    const rowData = formDefinition.map(field => {
      let value = formData[field.name];

      // Handle specific field types
      if (field.type === 'datetime') {
        // Ensure the value is a valid date string for Google Sheets
        if (value instanceof Date) {
          value = value.toISOString();
        } else if (typeof value === 'string') {
          // Try to parse if it's already a string that might be a date
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate)) {
            value = parsedDate.toISOString();
          } else {
            value = ''; // If parsing fails, set to empty
          }
        } else {
          value = ''; // If not a Date object or string, set to empty
        }
      } else if (value === undefined || value === null) {
        value = ''; // Ensure empty values are represented as empty strings for other types
      }

      return String(value); // Convert to string for sheet compatibility
    });

    // --- Find the row if the identifier already exists ---
    // We'll use a generic find function that can search by a specific column.
    // For now, we'll adapt findUserByEmail logic, assuming the uniqueIdentifierField is an email.
    // A more generic approach would be needed if the identifier is not an email.

    let existingRow = null;
    let rowIndex = -1;

    // --- Generic search logic ---
    // This part needs to be more flexible. For now, let's assume we can find a row by the unique identifier.
    // If the unique identifier is an email, we can use findUserByEmail.
    // If it's something else, we'd need a more general `findRowByValueInColumn` function.

    if (uniqueIdentifierField === 'email' || uniqueIdentifierField === 'Dirección de correo electrónico') {
      const result = await findUserByEmail(identifierValue); // Assuming findUserByEmail can handle different sheet names or is configured globally
      if (result) {
        existingRow = result.user;
        rowIndex = result.rowIndex;
      }
    } else {
      // If the unique identifier is not an email, we need a more generic way to find the row.
      // This might involve reading the entire sheet or a specific column and searching.
      // For now, we'll log a message and assume it's not found, leading to appending a new row.
      console.warn(`Searching by "${uniqueIdentifierField}" is not directly supported by findUserByEmail. Assuming new row.`);
      // A more robust implementation would involve a generic search function here.
    }


    if (existingRow !== null && rowIndex !== -1) {
      // --- Update existing row ---
      console.log(`Updating existing row ${rowIndex} in sheet "${sheetName}" for identifier: ${identifierValue}`);
      const updatePromises = formDefinition.map((field, index) => {
        // Determine column letter based on the field's position in the formDefinition.
        // This assumes the order in formDefinition directly maps to column order (A, B, C...).
        // A more robust approach would fetch headers and map field names to column letters.
        const columnLetter = String.fromCharCode(65 + index);
        const valueToUpdate = formData[field.name];
        if (valueToUpdate !== undefined) {
          return updateCell(spreadsheetId, sheetName, `${columnLetter}${rowIndex}`, String(valueToUpdate));
        }
        return Promise.resolve(); // Skip if no data for this field
      });
      await Promise.all(updatePromises);
      console.log('Row updated successfully.');
      return true;
    } else {
      // --- Append new row ---
      console.log(`Appending new row to sheet "${sheetName}" with identifier: ${identifierValue}`);
      // Ensure rowData matches the order of columns in the sheet.
      // If the sheet has headers, we should ensure rowData aligns with them.
      // For now, we assume the order in formDefinition dictates the order in the sheet.
      await appendSheetData(spreadsheetId, sheetName, rowData);
      console.log('New row appended successfully.');
      return true;
    }

  } catch (error) {
    console.error(`Error in submitForm for sheet "${sheetName}":`, error);
    return false;
  }
};

module.exports = {
  submitForm,
};
