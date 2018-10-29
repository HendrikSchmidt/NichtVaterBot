let express = require('express');
let bodyParser = require('body-parser');
let cronJob = require("cron").CronJob;
const axios = require('axios');
const PORT = process.env.PORT || 3000;
const path = require('path');
let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');
let https = require('https');

const options = {
    key: fs.readFileSync('./ssl/domain-key.txt'),
    cert: fs.readFileSync('./ssl/domain-crt.txt'),
};

let app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('static'));

app
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('index'))
    .listen(PORT);

https.createServer(options, app).listen(443);

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

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

        axios.post(
            'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
            {
                chat_id: 294184696,
                text: text,
                parse_mode: 'Markdown'
            }
        ).then(response => {
            axios.post(
                'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
                {
                    chat_id: 133024044,
                    text: 'Clara wurde erinnert.'
                }
            ).then(response => {
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
            axios.post(
                'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
                {
                    chat_id: 294184696,
                    text: 'Hast du die Pille genommen?'
                }
            ).then(response => console.log('Message posted'))
            .catch(err => console.log('Error :', err));
        }
    });
}, null, true, 'Europe/Berlin');

app.post('/new-message', function(req, res) {
    const { message } = req.body;

    console.log(message.chat.id);
    console.log(message.text);

    if (!message) {
        return res.end()
    }

    if (message.text.toLowerCase().indexOf('ping') >= 0) {
        axios.post(
            'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
            {
                chat_id: message.chat.id,
                text: 'pong'
            }
        ).then(response => {
            console.log('Message posted');
            res.end('ok');
        }).catch(err => {
            console.log('Error :', err);
            res.end('Error :' + err);
        });
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
                        axios.post(
                            'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
                            {
                                chat_id: message.chat.id,
                                text: answer
                            }
                        ).then(response => {
                            console.log('Message posted');
                            res.end('ok');
                        }).catch(err => {
                            console.log('Error :', err);
                            res.end('Error :' + err);
                        });
                    });
                }
            } else {
                res.end('ok');
            }
        });
    }

    if (message.text.toLowerCase().indexOf('debug') >= 0) {
        fs.readFile('./pillTaken', 'utf8', function (err, data) {
            if (err) throw err;
            axios.post(
                'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
                {
                    chat_id: message.chat.id,
                    text: data + '\n' + answer
                }
            ).then(response => {
                console.log('Message posted');
                res.end('ok');
            }).catch(err => {
                console.log('Error :', err);
                res.end('Error :' + err);
            });
        });
    }
});
