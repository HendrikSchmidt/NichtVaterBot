let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let cronJob = require("cron").CronJob;
const axios = require('axios');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/new-message', function(req, res) {
    const { message } = req.body;

    console.log(message.chat.id);
    console.log(message.text);

    if (!message || message.text.toLowerCase().indexOf('ping') < 0) {
        return res.end()
    }

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
});

app.listen(process.env.PORT || 3000, function() {
    console.log('Telegram app listening on port 3000!');
});

new cronJob("00 05 13 * * *", function() {

    axios.post(
        'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
        {
            chat_id: 133024044,
            text: 'Clara wurde erinnert.'
        }
    ).then(response => {
        console.log('Message posted');
    }).catch(err => {
        console.log('Error :', err);
    });
    // axios.post(
    //     'https://api.telegram.org/bot612610633:AAFVU-joVBwknVNMlxoflcCl_UDAei_YLWM/sendMessage',
    //     {
    //         chat_id: 294184696,
    //         text: 'Zeit die Pille zu nehmen :)'
    //     }
    // ).then(response => {
    //     console.log('Message posted');
    // }).catch(err => {
    //     console.log('Error :', err);
    // });
}, null, true, 'Europe/Berlin');