# Habitica-Telecron
Remote control your auto-cron for Habitica via Telegram

Habitica Telecron is a Google Apps Script project that integrates Habitica with Telegram, allowing users to control their auto-cron in day-to-day basis.
Example if you only want run cron at midnight if you are done ticking off your tasks/dailies, you can run command well ahead midnight to que for the auto-cron. And if you forget, it wont automatically cron.
This README will guide you through the process of setting up the required accounts, creating your Telegram bot, adding the code to Google Apps Scripts, and deploying the project.

## Prerequisites

Before getting started, you will need:

- A Telegram account
- A Google account
- A Habitica account

## Setting up a Telegram Bot

- Open the Telegram app or visit [Telegram Web](https://web.telegram.org/) and log in to your account.
- Search for the "BotFather" in the search bar and start a chat with it.
- Send the command `/newbot` to create a new bot.
- Follow the instructions provided by BotFather to set a name and username for your bot.
- Upon successful creation, BotFather will provide you with a bot token. Save this token, as you will need it later.

## Adding code to Google App Scripts!
- Go to [THE SCRIPT](https://script.google.com/d/12OlG4MF9Zq8j2i3A4EGN6-CZQb_VACNHuPsakZv2EXW8nbmLFSNeH1Lc/edit?usp=sharing) and sign in with your Google account.
- Click on the (i) icon in the top-left to go Project Details.
- In Project Details click on the "Make a copy", a paper icon in the top-right next to the star.
- New window should open and you may rename the script by clicking on "Copy of Habitica Telecron v.x.x"
- You now have all the script ready to be configurated.

## Configuring the Script

- In the `install.gs` file, locate the constants section at the top.
- Replace the placeholder values with the appropriate information:
  - `TELEGRAM_BOT_TOKEN`: Paste the bot token you received from BotFather.
  - `PASSWORD`: A password to protect access to your bot's functionality.
  - `HABITICA_USER_ID`: Your Habitica User ID (found in Settings > API on the Habitica website).
  - `HABITICA_API_KEY`: Your Habitica API Key (found in Settings > API on the Habitica website).
  - `WEB_APP_URL`: After deploying the prroject, enter Web App Url here.
- Save the project.

## Deploying the Project

- In the Google Apps Script project, click on "Publish" in the top menu, and then select "Deploy as web app."
- Set "Who has access to the app" to "Anyone, even anonymous."
- Click "Deploy" and copy the provided Web App URL. You will need this URL later.

## Installing the Bot

- In the `install.gs` file, locate the `WEB_APP_URL` constant and replace the placeholder value with the Web App URL you received during deployment.
- Save the project.
- Run the `install` function in the script editor by selecting the function from the dropdown menu and clicking the play button.

## Using the Bot

- Start a chat with your newly created Telegram bot on Telegram.
- The bot will ask for the password you set in the `install.gs` file. Enter the password to gain access.
- Once authenticated, the bot will provide you with a list of available functions and instructions on how to use them.

You have now successfully set up Habitica Telecron.
