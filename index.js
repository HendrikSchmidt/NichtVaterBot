const express = require('express');
const bodyParser = require('body-parser');
const cronJob = require('cron').CronJob;
const axios = require('axios');
const PORT = process.env.PORT || 3000;
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
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

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

new cronJob("10 05 13 * * *", function() {
    request({
        method: 'GET',
        url: 'https://www.astroportal.com/tageshoroskope/skorpion/1811/'
    }, function(err, response, body) {
        if (err) return console.error(err);

        let $ = cheerio.load(body);
        let titles = [];
        let horoscopes = [];
        $('.day1 > h2').each((index, element) => titles[index] = $(element).text());
        $('.day1 > p').each((index, element) => horoscopes[index] = $(element).text());

        const d = new Date();
        let weekday = weekdays[d.getDay()];

        let text = `Es ist *${weekday}*, Zeit die Pille zu nehmen. Dein Horoskop sagt heute Folgendes:\n`;
        for(let i = 0; i < 3; i++) {
            text += `\n*${titles[i]}*`;
            text += `\n${horoscopes[i]}\n`;
        }

        text += '\nHast du die Pille genommen?';

        sendMessage(294184696, text, { parse_mode: 'Markdown' })
        .then(response => {
            sendMessage(133024044, 'Clara wurde erinnert.')
            .then(response => {
                console.log('Message posted');
                fs.writeFile('./pillTaken', '0', function(err) {
                    if (err) throw err;
                });
            })
            .catch(err => console.log('Error :', err));
        })
        .catch(err => console.log('Error :', err));
    });
}, null, true, 'Europe/Berlin');

new cronJob("00 05 * * * *", function() {
    fs.readFile('./pillTaken', 'utf8', function (err, data) {
        if (err) throw err;
        if(data === '0') {
            sendMessage(294184696, 'Hast du die 💊 genommen?')
            .then(response => console.log('Message posted'))
            .catch(err => console.log('Error :', err));
        }
    });
}, null, true, 'Europe/Berlin');

app.post('/new-message', function(req, res) {
    const { message } = req.body;
    console.log('Message received:' + message.text);

    if (!message) {
        return res.end();
    }

    if (message.text.toLowerCase().indexOf('ping') >= 0) {
        sendMessageAndEndRes(res, message.chat.id, 'pong');
    }

    const answers = ['Gut! 👍', 'Supi 💪', 'Toll! 🤞', 'Weiter so! 🤟', '🤙', '👏'];
    const answer = answers[Math.floor(Math.random() * answers.length)];

    if (message.text.toLowerCase().indexOf('ja') >= 0) {
        fs.readFile('./pillTaken', 'utf8', function (err, data) {
            if (err) throw err;
            if(data === '0') {
                if (message.chat.id === 294184696) {
                    fs.writeFile('./pillTaken', '1', function(err) {
                        if (err) throw err;
                        sendMessageAndEndRes(res, message.chat.id, answer);
                    });
                }
            } else {
                res.end('ok');
            }
        });
    }

    let replyMarkup = {
        keyboard: [
            ['Ja 😍'],
            ['⏰ Erinner mich in 30 Minuten!'],
            ['⏰ Erinner mich in einer Stunde!'],
            ['⏰ Erinner mich in zwei Stunden!']
        ],
        one_time_keyboard: true,
    };

    if (message.text.toLowerCase().indexOf('⏰ Erinner mich in') >= 0) {
        if (message.text.toLowerCase().indexOf('30 Minuten!') >= 0) {

        }
        if (message.text.toLowerCase().indexOf('einer Stunde!') >= 0) {

        }
        if (message.text.toLowerCase().indexOf('zwei Stunden!') >= 0) {

        }
    }

    if (message.text.toLowerCase().indexOf('debug') >= 0) {
        fs.readFile('./pillTaken', 'utf8', function (err, data) {
            if (err) throw err;
            sendMessageAndEndRes(res, message.chat.id, data + '\n' + answer, { reply_Markup: replyMarkup });
        });
    }
});

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

sendMessage(133024044, 'Runs.');