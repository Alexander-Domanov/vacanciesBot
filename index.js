
const { google } = require("googleapis");

function NodeGoogleSheets(file, sheetId, keyMass, fun) {
    const auth = new google.auth.GoogleAuth({
        keyFile: file,
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    (async () => {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = sheetId;

        const metaData = await googleSheets.spreadsheets.get({
            auth,
            spreadsheetId,
        });

        const data = {
            auth,
            spreadsheetId,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: keyMass.change,
            },
        }
        if(keyMass.append) {
            data['range'] = keyMass.append;
            const append = await googleSheets.spreadsheets.values.append(data);

            fun(append);
        } else if(keyMass.values) {
            data['range'] = keyMass.values;

            delete data.valueInputOption; delete data.resource;
            const values = await googleSheets.spreadsheets.values.get(data);

            fun(values);
        } else if(keyMass.update) {
            data['range'] = keyMass.update;

            const update = await googleSheets.spreadsheets.values.update(data);

            fun(update);
        }
    })();
}

const saveDataVacancies = ({date = 0, firstName = '', lastName = '', tg, message, agree = 'Нет'})=> NodeGoogleSheets('google_file.json', '1Slpm3j_yIhoxCjFA1pJYr9d-cle0nRTwylYh17kkxA4', {append: 'vacancies',
    change: [[date, firstName,lastName,`https://t.me/${tg}`,message, agree]]}, (data) => {
})

const saveWithoutData = ({date = 0, firstName = '', lastName = '', tg})=> NodeGoogleSheets('google_file.json', '1Slpm3j_yIhoxCjFA1pJYr9d-cle0nRTwylYh17kkxA4', {append: 'vacanciesWithoutData',
    change: [[date, firstName,lastName,`https://t.me/${tg}`]]}, (data) => {
})

const TelegramAPI = require('node-telegram-bot-api')

const bot = new TelegramAPI('6993113566:AAGYi5kv5JMxpC2YVLIIneY_UG8F9KNmHng',
    {
        polling: true
    }
)

const pattern = /^[\d\+][\d\(\)\s-.]{2,14}\d.*$|(5\.\s*|5\s*)?[\d\+][\d\(\)\s-.]{2,14}\d.*$/;

let userAgreeDataProcessing = false

const start = () => {
    bot.setMyCommands([
        {command: '/start', description:'Начать работу с ботом'},
    ])

    bot.on('message',async (msq)=> {
        const text = msq.text
        const chatID = msq.chat.id

        const {first_name, last_name, username} = msq.from
        const dateUser = msq.date

        const buttonAgree = {
            inline_keyboard: [[{text: "Согласен на обработку персональных данных", callback_data: 'agree'}],],
        }

        const info = 'Для оставления отклика на вакансию, пожалуйста, предоставьте следующую информацию одним сообщением:\n' +
            '\n' +
            '1. ФИО\n' +
            '2. Сколько вам лет? \n' +
            '3. Город проживания. \n' +
            '4. Интересует ли вас полная или частичная занятость?\n' +
            '5. Ваш номер телефона (обязательно).'
        const messageAgreeDataProcessing = `Перед заполнением анкеты необходимо ваше согласие на обработку персональных данных (согласие на обратный звонок по вашему номеру телефона, который мы попросим оставить вас для связи и обсуждения деталей).`

        bot.on('callback_query', async (query) => {
            const messageChatID = query.message.chat.id
            if (query.data === 'agree' && !userAgreeDataProcessing) {
                userAgreeDataProcessing = true
                return await bot.sendMessage(messageChatID, info)
            }
        })
        if (text === '/start') {
            let s = new Date(dateUser * 1000).toLocaleString("ru")
            userAgreeDataProcessing = false
            saveWithoutData({date: s, firstName: first_name,lastName: last_name,tg:username})
            await bot.sendMessage(chatID,
                `
                ${'Приветствуем Вас, дорогой кандидат👋🏻\n'}${'Если Вы находитесь здесь, значит, мы нужны друг другу🫂\n'}${'Для начала, давайте с Вами познакомимся🙃\n\n'}${messageAgreeDataProcessing}`,
                {
                    reply_markup: {
                        inline_keyboard: buttonAgree.inline_keyboard
                    }
                }
            )
            return await bot.sendMessage(chatID, 'Если вы не согласны оставить свой номер телефона для обратной связи, предлагаем вам напрямую связаться с отделом по персоналу.\n' +
                '\n' +
                'Сделать это можно по номеру:\n' +
                '+375291342537 (рабочий)\n' +
                '+375445772051 (Павел)\n' +
                '\n' +
                'или написать в ТГ:\n' +
                '@Pashak86')
        }
        if (userAgreeDataProcessing) {
            if (text.match(pattern)) {
                let s = new Date(dateUser * 1000).toLocaleString("ru")
                saveDataVacancies({date: s, firstName: first_name,lastName: last_name,tg:username,message: text, agree: 'Да'})
                userAgreeDataProcessing = false
                return await bot.sendMessage(chatID, 'Благодарим за ваш отклик!)\n' +
                    'В течение дня наш специалист свяжется с Вами для обсуждения дальнейших действий.')
            }
            else {
                return await bot.sendMessage(chatID, `${info}\nНомер телефона обязателен!`)
            }
        }

        return await bot.sendMessage(chatID, messageAgreeDataProcessing, {
            reply_markup: {
                inline_keyboard: buttonAgree.inline_keyboard
            }
        })
    })

}

start()
