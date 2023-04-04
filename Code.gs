/**
 * Habitica Telecron v 1.0
 * Remote control your auto-cron via Telegram
 * 
 * Documentation on how to use at GitHub: https://github.com/Niemiz/Habitica-Telecron
 * Made by @Swedo in Habitica RPG
 */

const TELEGRAM_BOT_TOKEN = 'INSERT YOUR TELEGRAM BOT TOKEN HERE'; 
const PASSWORD = 'mypass'; // Change this too, it's one-time password for using your Telegram bot
const HABITICA_USER_ID = 'INSERT YOUR HABITICA USER ID HERE'; 
const HABITICA_API_KEY = 'INSERT YOUR HABITICA API TOKEN HERE'; 
const WEB_APP_URL = 'INSERT YOUR WEB APP URL HERE';
const SPREADSHEET_NAME = 'Habitica Telecron'; // Spreadsheet will be created with this name






/**
 * Do not edit anything below (unless you know what you do ofc)
 */
// Install function to run
function install() {
  const spreadsheet = getOrCreateSpreadsheetByName(SPREADSHEET_NAME);
  const sheet = spreadsheet.getSheetByName('Sheet1') || spreadsheet.insertSheet('Sheet1');

  uninstall();
  setupSheet(sheet);
  setWebhook();
  createDayStartTimeTrigger();
  console.log('Installation complete');
}

// Function to get or create a spreadsheet by its name
function getOrCreateSpreadsheetByName(name) {
  const files = DriveApp.getFilesByName(name);
  let file;
  while (files.hasNext()) {
    const spreadsheet = files.next();
    if (spreadsheet.getMimeType() === 'application/vnd.google-apps.spreadsheet') {
      file = spreadsheet;
      break;
    }
  }

  if (file) {
    return SpreadsheetApp.openById(file.getId());
  } else {
    return SpreadsheetApp.create(name);
  }
}

function setWebhook() {
  const url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/setWebhook?url=' + encodeURIComponent(WEB_APP_URL);
  try {
    UrlFetchApp.fetch(url);
    console.log('Webhook set successfully');
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
}

// Function to set up the sheet headers
function setupSheet(sheet) {
  console.log('Setting up sheet...');
  const headers = sheet.getRange(1, 1, 1, 3).getValues()[0];
  if (headers[0] !== 'chatID' || headers[1] !== 'cron' || headers[2] !== 'reset') {
    sheet.getRange(1, 1, 1, 3).setValues([['chatID', 'cron', 'reset']]);
  }
  console.log('Sheet setup complete');
}

// Function to create a trigger for runDayStartTimeChecks
function createDayStartTimeTrigger() {
  console.log('Creating day start time trigger...');
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of existingTriggers) {
    if (trigger.getHandlerFunction() === 'runDayStartTimeChecks') {
      console.log('Day start time trigger already exists');
      return; // Trigger already exists, do not create a new one
    }
  }

  runDayStartTimeChecks(); // Run the function immediately to set the first trigger
  console.log('Day start time trigger created');
}
// Function to run checks at user's Habitica day start time
function runDayStartTimeChecks() {
  console.log('Running day start time checks...');
  const sheet = getOrCreateSpreadsheetByName(SPREADSHEET_NAME).getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const userId = data[i][0];
    const cron = data[i][1];
    const reset = data[i][2];

    if (cron === 1) {
      runHabiticaCron();

      if (reset === 1) {
        sheet.getRange(i + 1, 2).setValue(0); // Set cron value to 0
      }
    }
  }

  // Schedule the next trigger
  createCustomDayStartTrigger();
  console.log('Day start time checks complete');
}

// Function to get user's Habitica day start time
function getDayStartTime() {
  console.log('Getting Habitica day start time...');
  const url = 'https://habitica.com/api/v3/user';
  const options = {
    method: 'GET',
    headers: {
      'x-api-user': HABITICA_USER_ID,
      'x-api-key': HABITICA_API_KEY,
      "x-client": "569c43fc-892c-4dcc-bab5-d0a905476b76-HabiticaTelecron",
    },
  };
  const response = UrlFetchApp.fetch(url, options);
  const user = JSON.parse(response.getContentText()).data;
  console.log(`Habitica day start time: ${user.preferences.dayStart}`);
  return user.preferences.dayStart;
}
// Function to create a trigger based on user's day start time
function createCustomDayStartTrigger() {
  console.log('Creating custom day start trigger...');

  // Remove existing triggers
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of existingTriggers) {
    if (trigger.getHandlerFunction() === 'runDayStartTimeChecks') {
      ScriptApp.deleteTrigger(trigger);
      console.log('Existing day start time trigger removed');
    }
  }

  const dayStartTime = getDayStartTime();
  const now = new Date();
  const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayStartTime, 1, 0); // Added 1 minute after the day start time

  if (now > triggerTime) {
    triggerTime.setDate(triggerTime.getDate() + 1);
  }

  ScriptApp.newTrigger('runDayStartTimeChecks')
    .timeBased()
    .at(triggerTime)
    .create();
  console.log(`Custom day start trigger created at ${triggerTime}`);
}


function doPost(e) {
  console.log('Processing doPost...');
  const update = JSON.parse(e.postData.contents);
  const chatId = update.message.chat.id;
  const text = update.message.text;
  const userId = update.message.from.id;

  const sheet = getOrCreateSpreadsheetByName(SPREADSHEET_NAME).getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();
  const userRow = findUserRow(sheet, userId);

  if (userRow === -1) {
    if (text.startsWith('/start')) {
      const enteredPassword = text.split(' ')[1];
      if (enteredPassword === PASSWORD) {
        // Add the user to the spreadsheet
        sheet.appendRow([userId, 0, 0]);
        sendMessage(chatId, 'Welcome! You have been added to the bot. You can type /help to see all my commands');
        console.log(`User ${userId} added to the bot.`);
      } else {
        sendMessage(chatId, 'Incorrect password. Please provide the correct password after the /start command (e.g., /start your_password).');
        console.log(`User ${userId} provided incorrect password.`);
      }
    } else {
      sendMessage(chatId, 'You are not authorized to use this bot. Please use /start with your password.');
      console.log(`Unauthorized user ${userId} tried to use the bot.`);
    }
  } else {
    if (text === '/cron') {
      const currentCronValue = data[userRow][1];
      const newCronValue = currentCronValue === 1 ? 0 : 1;
      sheet.getRange(userRow + 1, 2).setValue(newCronValue);
      console.log(`User ${userId} changed cron value to ${newCronValue}.`);

      const cronMessage = `Cron value has been set to ${newCronValue}.`;

      if (newCronValue === 1) {
        // Get the day and time when the cron will run
        const dayStartTime = getDayStartTime();
        const now = new Date();
        const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayStartTime, 1, 0);
        if (now > triggerTime) {
          triggerTime.setDate(triggerTime.getDate() + 1);
        }

        // Update the trigger
        createCustomDayStartTrigger();

        const triggerTimeMessage = `Cron will run on ${triggerTime.toDateString()} at ${triggerTime.toLocaleTimeString()}.`;
        sendMessage(chatId, `${cronMessage}\n${triggerTimeMessage}`);
      } else {
        sendMessage(chatId, cronMessage);
      }
    } else if (text === '/reset') {
      const currentResetValue = data[userRow][2];
      const newResetValue = currentResetValue === 1 ? 0 : 1;
      sheet.getRange(userRow + 1, 3).setValue(newResetValue);
      sendMessage(chatId, `Reset value has been set to ${newResetValue}.`);
      console.log(`User ${userId} changed reset value to ${newResetValue}.`);
    } else if (text === '/status') {
  const cronValue = data[userRow][1];
  const resetValue = data[userRow][2];
  let statusMessage = `Cron value: ${cronValue}\nReset value: ${resetValue}`;

  if (cronValue === 1) {
    const dayStartTime = getDayStartTime();
    const now = new Date();
    const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayStartTime, 1, 0);
    if (now > triggerTime) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }

    // Update the trigger
    createCustomDayStartTrigger();

    const triggerTimeMessage = `Cron will run on ${triggerTime.toDateString()} at ${triggerTime.toLocaleTimeString()}.`;
    statusMessage += `\n${triggerTimeMessage}`;
  }

  sendMessage(chatId, statusMessage);
  console.log(`User ${userId} checked the status.`);
    } else if (text === '/help') {
      const helpMessage = 'Commands available:\n/help - this help section\n/cron - auto-cron switch (1 is enabled, 0 is disabled)\n/reset - if 1 it will disable cron next day automatically\n/status - get the current values of cron and reset\nFor any further questions or help message @Niemil';
      sendMessage(chatId, helpMessage);
      console.log(`User ${userId} requested help.`);
    } else {
      sendMessage(chatId, 'Invalid command. Please use /cron, /reset, /status, or /help commands.');
      console.log(`User ${userId} sent an invalid command: ${text}`);
    }
  }
}
// Function to find the user row in the spreadsheet
function findUserRow(sheet, userId) {
  console.log('Finding user row...');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      console.log(`User found at row ${i}`);
      return i;
    }
  }
  console.log('User not found');
  return -1;
}

// Function to send messages to the Telegram chat
function sendMessage(chatId, text) {
  console.log('Sending message...');
  const url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURIComponent(text);
  UrlFetchApp.fetch(url);
  console.log('Message sent');
}


// Function to run the Habitica cron
function runHabiticaCron() {
  console.log('Running Habitica cron...');
  const url = 'https://habitica.com/api/v3/cron';
  const options = {
    method: 'POST',
    headers: {
      'x-api-user': HABITICA_USER_ID,
      'x-api-key': HABITICA_API_KEY,
      "x-client": "569c43fc-892c-4dcc-bab5-d0a905476b76-HabiticaTelecron",
    },
  };
  UrlFetchApp.fetch(url, options);
  console.log('Habitica cron complete');
}

function uninstall() {
  console.log('cleaning up...');

  // Remove the trigger
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'runDayStartTimeChecks') {
      ScriptApp.deleteTrigger(trigger);
      console.log('Day start time trigger removed');
      break;
    }
  }

  // Clear the content of the 'Sheet1' in the existing spreadsheet
  const spreadsheet = getOrCreateSpreadsheetByName(SPREADSHEET_NAME);
  const sheet = spreadsheet.getSheetByName('Sheet1');
  if (sheet) {
    sheet.clear();
    console.log(`Content of 'Sheet1' in the spreadsheet '${SPREADSHEET_NAME}' cleared`);
  } else {
    console.log(`No sheet named 'Sheet1' found in the spreadsheet '${SPREADSHEET_NAME}'`);
  }

  console.log('cleanup complete!');
}
