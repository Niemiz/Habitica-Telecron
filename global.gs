const scriptProperties = PropertiesService.getScriptProperties();

function goInstall(){
  uninstall();
  setProp("CRON", "0");
  setProp("RESET", "0");
  setWebhook();
  createDayStartTimeTrigger();
  console.log('Installation complete');
}

function setWebhook() {
  let url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/setWebhook?url=' + encodeURIComponent(WEB_APP_URL);
  try {
    UrlFetchApp.fetch(url);
    console.log('Webhook set successfully');
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
}

// Function to create a trigger for runDayStartTimeChecks
function createDayStartTimeTrigger() {
  console.log('Creating day start time trigger...');
  let existingTriggers = ScriptApp.getProjectTriggers();
  
  for (let trigger of existingTriggers) {
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
  if (getProp("CRON") == "0"){
    console.log('Not running cron.');
  } else {
    runHabiticaCron();
  }
  if (getProp("RESET") == "0"){
    console.log('Not resetting cron values');
  } else {
    doReset();
  }  
}

function doReset() {
  console.log("Resetting cron to 0");
  setProp("CRON", "0");
}

function toggleReset(chatId) {
  if (getProp("RESET") == "0") {
    setProp("RESET", "1");
    sendMessage(chatId, 'Reset set to 1');
  } else {
    setProp("RESET", "0");
    sendMessage(chatId, 'Reset set to 0');
  }
}


function toggleCron(chatId) {
  if (getProp("CRON") == "0") {
    setProp("CRON", "1");
    // Update the trigger
    createCustomDayStartTrigger();
    let nextCronTime = getFormattedTriggerTime(); // Get the formatted next cron time
    sendMessage(chatId, `Cron set to 1 (${nextCronTime})`);
  } else {
    setProp("CRON", "0");
    sendMessage(chatId, 'Cron set to 0');
  }
}


// Function to get user's Habitica day start time
function getDayStartTime() {
  console.log('Getting Habitica day start time...');
  let url = 'https://habitica.com/api/v3/user';
  let options = {
    method: 'GET',
    headers: {
      'x-api-user': HABITICA_USER_ID,
      'x-api-key': HABITICA_API_KEY,
      "x-client": "569c43fc-892c-4dcc-bab5-d0a905476b76-HabiticaTelecron",
    },
  };
  let response = UrlFetchApp.fetch(url, options);
  let user = JSON.parse(response.getContentText()).data;
  console.log(`Habitica day start time: ${user.preferences.dayStart}`);
  return user.preferences.dayStart;
}

// Function to create a trigger based on user's day start time
function createCustomDayStartTrigger() {
  console.log('Creating custom day start trigger...');

  // Remove existing triggers
  let existingTriggers = ScriptApp.getProjectTriggers();
  for (let trigger of existingTriggers) {
    if (trigger.getHandlerFunction() === 'runDayStartTimeChecks') {
      ScriptApp.deleteTrigger(trigger);
      console.log('Existing day start time trigger removed');
    }
  }

  let dayStartTime = getDayStartTime();
  let now = new Date();
  let triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayStartTime, 1, 0); // Added 1 minute after the day start time

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
  let update = JSON.parse(e.postData.contents);
  let chatId = update.message.chat.id.toString(); // Convert chatId to string
  let text = update.message.text;

  if (chatId == getProp("USER")) {
    handleCommands(chatId, text);
  } else if (text.startsWith('/start')) {
    let enteredPassword = text.split(' ')[1];
    if (enteredPassword == PASSWORD) {
      // Add the user
      setProp("USER", chatId);
      sendMessage(chatId, 'Welcome! You have been added to the bot. You can type /help to see all my commands');
    } else {
      sendMessage(chatId, 'Incorrect password. Please provide the correct password after the /start command (e.g., /start your_password).');
    }
  } else {
    sendMessage(chatId, 'You are not authorized to use this bot. Please use /start with your password directly after it (e.g., /start your_password).');
  }
}

function handleCommands(chatId, text) {
  if (text == '/cron') {
    toggleCron(chatId);
  } else if (text == '/reset') {
    toggleReset(chatId);
  } else if (text == '/status') {
    createCustomDayStartTrigger();
    let nextCronTime = getFormattedTriggerTime();
  if (getProp("CRON") == "0") {
    sendMessage(chatId, `Cron is ${getProp("CRON")}\nReset is ${getProp("RESET")}`);
  } else {
    sendMessage(chatId, `Cron is ${getProp("CRON")} (${nextCronTime})\nReset is ${getProp("RESET")}`);
  }
} else if (text == '/help') {
  let helpMessage = 'Commands available:\n/help - this help section\n/cron - auto-cron switch (1 is enabled, 0 is disabled)\n/reset - if 1 it will disable cron next day automatically\n/status - get the current values of cron and reset\nFor any further questions or help message @Niemil';
  sendMessage(chatId, helpMessage);
} else {
  sendMessage(chatId, 'Invalid command. Please use /cron, /reset, /status, or /help commands.');
  }
}

function getFormattedTriggerTime() {
  let dayStartTime = getDayStartTime();
  let now = new Date();
  let triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayStartTime, 1, 0);
  if (now > triggerTime) {
    triggerTime.setDate(triggerTime.getDate() + 1);
  }
  return Utilities.formatDate(triggerTime, Session.getScriptTimeZone(), "MMMM dd 'at' hh:mma");
}

// Function to send messages to the Telegram chat
function sendMessage(chatId, text) {
  let url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURIComponent(text);
  UrlFetchApp.fetch(url);
}


// Get and Set Properties
function getProp(name) {
  return scriptProperties.getProperty(name);
}
function setProp(name, value) {
  scriptProperties.setProperty(name, value);
}

// Function to run the Habitica cron
function runHabiticaCron() {
    console.log('Running Habitica cron...');
    let url = 'https://habitica.com/api/v3/cron';
    let options = {
      method: 'POST',
      headers: {
        'x-api-user': HABITICA_USER_ID,
        'x-api-key': HABITICA_API_KEY,
        'x-client': '569c43fc-892c-4dcc-bab5-d0a905476b76-HabiticaTelecron',
      }
  };
  UrlFetchApp.fetch(url, options);
  console.log('Habitica cron complete');
}

function uninstall() {
  console.log('cleaning up...');
  // Remove triggers
  let triggers = ScriptApp.getProjectTriggers();
  for (let trigger of triggers) {
    if (trigger.getHandlerFunction() === 'runDayStartTimeChecks') {
      ScriptApp.deleteTrigger(trigger);
      console.log('Day start time trigger removed');
      break;
    }
  }
  scriptProperties.deleteAllProperties();
  console.log('cleanup complete!');
}
