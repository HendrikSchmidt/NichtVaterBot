const express = require('express');
const bodyParser = require('body-parser');
const cronJob = require('cron').CronJob;
const axios = require('axios');
const PORT = process.env.PORT || 3000;
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const http = require('http');

const app = express();
app
    .use(bodyParser.json())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('index'));

app.use(function (req, res, next) {
    console.log('Time:', Date.now());
    console.log(req.body);
    next();
});

http.createServer(app).listen(PORT);

const chatIds = { Clara: 294184696, Hendrik: 133024044};
const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const answers = ['Gut! 👍', 'Supi 💪', 'Toll! 🤞', 'Weiter so! 🤟', '🤙', '👏', 'Du solltest dafür bezahlt werden ;)'];
const replyMarkup = {
    keyboard: [
        ['Ja 😍'],
        ['⏰ Erinner mich in 30 Minuten!'],
        ['⏰ Erinner mich in einer Stunde!'],
        ['⏰ Erinner mich in zwei Stunden!']
    ],
    one_time_keyboard: true,
};
let nextReminder;
let pillTaken = true;

new cronJob("0 05 13 * * *", () => {
    sendHoroscopeMessage();
    pillTaken = false;
    setTimeout(() => {
        sendReminderMessage()
            .then(response => {
                clearInterval(nextReminder);
                nextReminder = setInterval(sendReminderMessage, 60 * 60 * 100);
                sendMessage(chatIds.Hendrik, 'Clara wurde erinnert.')
                    .then(response => console.log('Message posted'))
                    .catch(err => console.log('Error :', err));
            })
    }, 5000);
}, null, true, 'Europe/Berlin');

app.post('/new-message', (req, res) => {
    const { message } = req.body;
    console.log('Message received:' + message.text);

    if (!message) res.end();

    if (message.text.toLowerCase().indexOf('ping') >= 0) {
        sendMessageAndEndRes(res, message.chat.id, 'pong ' + pillTaken);
    }

    if (message.text.toLowerCase().indexOf('ja') >= 0 && !pillTaken) {
        const answer = answers[Math.floor(Math.random() * answers.length)];

        if (message.chat.id === chatIds.Clara) {
            pillTaken = true;
            clearInterval(nextReminder);
            sendMessageAndEndRes(res, message.chat.id, answer);
        } else {
            res.end('ok');
        }
    }

    if (message.text.indexOf('Erinner mich') >= 0 && !pillTaken) {
        clearInterval(nextReminder);
        if (message.text.indexOf('30 Minuten!') >= 0) {
            nextReminder = setInterval(sendReminderMessage, 30 * 60 * 1000);
        } else if (message.text.indexOf('einer Stunde!') >= 0) {
            nextReminder = setInterval(sendReminderMessage, 60 * 60 * 1000);
        } else if (message.text.indexOf('zwei Stunden!') >= 0) {
            nextReminder = setInterval(sendReminderMessage, 120 * 60 * 1000);
        }
        res.end('ok');
    }

    res.end();
});

const sendReminderMessage = () => {
    if (pillTaken) clearInterval(nextReminder);
    return sendMessage(chatIds.Clara, 'Hast du die 💊 genommen?', { reply_Markup: replyMarkup })
        .then(response => console.log('Message posted'))
        .catch(err => console.log('Error:' + err));
};

const sendHoroscopeMessage = () => {
    request({
        method: 'GET',
        url: 'https://www.astroportal.com/tageshoroskope/skorpion/1811/'
    }, (err, response, body) => {
        if (err) return console.error(err);

        let $ = cheerio.load(body);
        let titles = [];
        let horoscopes = [];
        $('.day1 > h2').each((index, element) => titles[index] = $(element).text());
        $('.day1 > p').each((index, element) => horoscopes[index] = $(element).text());

        const d = new Date();
        let weekday = weekdays[d.getDay()];

        let text = `Es ist *${weekday}*. Dein Horoskop sagt heute Folgendes:\n`;
        for (let i = 0; i < 3; i++) {
            text += `\n*${titles[i]}*`;
            text += `\n${horoscopes[i]}\n`;
        }

        sendMessage(chatIds.Clara, text, {parse_mode: 'Markdown'})
            .then(response => console.log('Message posted'))
            .catch(err => console.log('Error:' + err));
    });
};

const sendMessageAndEndRes = (res, chatId, text, settings = {}) => {
    sendMessage(chatId, text, settings)
        .then(response => {
            console.log('Message posted');
            res.end('ok');
        }).catch(err => {
            console.log('Error:' + err);
            res.end('Error:' + err);
    });
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
};

sendMessage(chatIds.Hendrik, 'Runs.');