const express = require('express');
const bodyParser = require('body-parser');
const cronJob = require('cron').CronJob;
const axios = require('axios');
const request = require('request');
const cheerio = require('cheerio');
const PORT = process.env.PORT || 3000;

const app = express();
app
    .use(bodyParser.json())
    .get('/', (req, res) => res.send('This Telegram bot reminds you to take the 💊.'))
    .use((req, res, next) => {
        console.log('Time:', Date.now());
        console.log(req.body);
        next();
    })
    .listen(PORT);

const develop = false;
const minuteLength = develop ? 100 : 60 * 1000;
const chatIds = { Clara: develop ? 133024044 : 294184696, Hendrik: 133024044};
const reminderTime = develop ? '0 * * * * *' : '0 05 13 * * *';
const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const answers = ['Gut! 👍', 'Supi 💪', 'Toll! 🤞', 'Weiter so! 🤟', '🤙', '👏', 'Du solltest dafür bezahlt werden 🤑'];
const replyMarkup = {
    keyboard: [
        ['✅ Ja!'],
        ['⏰ Erinner mich in einer Stunde!'],
        ['⏰⏰ Erinner mich in zwei Stunden!'],
        ['📆 Ich mache eine Woche Pause!'],
        ['💊 Ich nehme die Pille jetzt wieder!'],
    ],
};
let nextReminder;
let pillTaken = true;
let pauseDays = 0;

new cronJob(reminderTime, () => {
    sendHoroscopeMessage();
    if (pauseDays > 0) {
        pauseDays--;
    } else if (pauseDays === 0) {
        pillTaken = false;
        setTimeout(() => {
            sendReminderMessage()
                .then(response => {
                    clearInterval(nextReminder);
                    nextReminder = setInterval(sendReminderMessage, 60 * minuteLength);
                    sendMessage(chatIds.Hendrik, 'Clara wurde erinnert.')
                })
        }, 5000);
    }
}, null, true, 'Europe/Berlin');

app.post('/new-message', (req, res) => {
    const { message } = req.body;
    console.log('Message received:' + message.text);

    const d = new Date();
    let response = '';

    if (!message) response = 'Ich habe keine Nachricht erhalten.';
    else if (message.text === 'pill') response = 'poll ' + pillTaken;
    else if (message.text.toLowerCase().indexOf('ja') >= 0 && !pillTaken) {
        pillTaken = true;
        clearInterval(nextReminder);
        response = answers[Math.floor(Math.random() * answers.length)];
    }
    else if (message.text.indexOf('Erinner mich') >= 0 && !pillTaken) {
        clearInterval(nextReminder);
        const hours = d.toLocaleString('de-DE', {hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' });
        const minutes = d.toLocaleString('de-DE', {minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' });
        if (message.text.indexOf('einer Stunde!') >= 0) {
            nextReminder = setInterval(sendReminderMessage, 60 * minuteLength);
            response = `Ich erinnere dich um *${parseInt(hours) + 1}:${minutes} Uhr* wieder.`;
        } else if (message.text.indexOf('zwei Stunden!') >= 0) {
            nextReminder = setInterval(sendReminderMessage, 120 * minuteLength);
            response = `Ich erinnere dich um *${parseInt(hours) + 2}:${minutes} Uhr* wieder.`;
        }
    } else if (message.text.toLowerCase().indexOf('pause') >= 0) {
        clearInterval(nextReminder);
        pauseDays = pillTaken ? 7 : 6;
        const weekday = weekdays[d.getDay()];
        response = `Ich erinnere dich nächsten *${weekday}* wieder.`;
    } else if (message.text.toLowerCase().indexOf('💊') >= 0) {
        pauseDays = 0;
        response = `Ich erinnere dich beim nächsten mal wieder.`;
    }
    else response = 'Ich habe die Nachricht leider nicht verstanden 😔';

    return respond(res, message.chat.id, response, { parse_mode: 'Markdown' });
});

const sendReminderMessage = () => {
    return sendMessage(chatIds.Clara, 'Hast du die 💊 genommen?', { reply_markup: replyMarkup })
};

const sendHoroscopeMessage = () => {
    request({
        method: 'GET',
        url: 'https://www.astroportal.com/tageshoroskope/skorpion/1811/'
    }, (err, response, body) => {
        if (err) return console.error(err);

        const $ = cheerio.load(body);
        const titles = [];
        const horoscopes = [];
        $('.day1 > h2').each((index, element) => titles[index] = $(element).text());
        $('.day1 > p').each((index, element) => horoscopes[index] = $(element).text());

        const d = new Date();
        const weekday = weekdays[d.getDay()];

        let text = `Es ist *${weekday}*. Dein Horoskop sagt heute Folgendes:\n`;
        for (let i = 0; i < 3; i++) {
            text += `\n*${titles[i]}*`;
            text += `\n${horoscopes[i]}\n`;
        }

        return sendMessage(chatIds.Clara, text, { parse_mode: 'Markdown' });
    });
};

const respond = (res, chatId, text, settings = {}) => {
    res.send({
        method: 'sendMessage',
        chat_id: chatId,
        text: text,
        ...settings
    });
    console.log('Responded');
    return res.end('ok');
};

const sendMessage = (chatId, text, settings = {}) => {
    return axios.post(
        'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
        {
            chat_id: chatId,
            text: text,
            ...settings
        }
    )
        .then(response => console.log('Message posted, Response:' + response))
        .catch(err => console.log('Error:' + err));
};

sendMessage(chatIds.Hendrik, 'Runs.');
console.log('Runs.');