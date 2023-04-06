///////////
//Config

var BK_CURRENT_POWER  = "alias.0.Shelly.Balkonkraftwerk.Power";
var BK_PRODUCED_TODAY = "0_userdata.0.Erzeugt.Heute_Erzeugt";
var BK_PRODUCED_WEEK  = "0_userdata.0.Erzeugt.Woche_Erzeugt";
var BK_PRODUCED_MONTH = "0_userdata.0.Erzeugt.Monat_Erzeugt";
var BK_PRODUCED_TOTAL = "0_userdata.0.Erzeugt.Gesamt_Erzeugt";

var TELEGRAM = "telegram.0";

var CONFIG =
{
    "MENU": {
        typ: "MENU",
        text: "Hauptmenu:",
        keyboard:
            [
                ["Strom"],
            ],
    },
    "STROM": {
        typ: "MENU",
        text: "Strom Menu:",
        keyboard:
            [
                ["Balkonkraftwerk"],
                ["PC"],
                ["Stromzähler"],
            ]
    },
    "BALKONKRAFTWERK": {
        typ: "MENU",
        text: "Balkonkraftwerk Menu:",
        keyboard:
            [
                ["Balkonkraftwerk Jetzt"],
                ["Balkonkraftwerk Heute"],
                ["Balkonkraftwerk Woche"],
                ["Balkonkraftwerk Monat"],
                ["Balkonkraftwerk Gesamt"]
            ]
    },
    "BALKONKRAFTWERK JETZT": {
        typ: "ACTION",
        action: async function () { return await sendState(BK_CURRENT_POWER, "W"); },
    },
    "BALKONKRAFTWERK HEUTE": {
        typ: "ACTION",
        action: async function () { return await sendState(BK_PRODUCED_TODAY, "Wh"); },
    },
    "BALKONKRAFTWERK WOCHE": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_WEEK, BK_PRODUCED_TODAY, "kWh"); },
    },
    "BALKONKRAFTWERK MONAT": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_MONTH, BK_PRODUCED_TODAY, "kWh"); },
    },
    "BALKONKRAFTWERK GESAMT": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_TOTAL, BK_PRODUCED_TODAY, "kWh"); },
    },
};

///////////
//Helper

/**
* @param {any} obj
*/
function log(obj) { console.log(obj) };
/**
* @param {string} obj
*/
function error(obj) { console.error(obj) };
/**
* @param {any} obj
*/
function isString(obj) { return typeof obj === 'string' || obj instanceof String }
/**
* @param {any} obj
*/
function isNumber(obj) { return typeof obj === 'number' }
/**
* @param {any} obj
*/
function isNull(obj) { return obj === undefined || obj === null }

///////////
//Telegram

/**
* @param {string} objId
* @param {string} msg
*/
async function sendState(objId, msg = "") 
{
    if (!isString(objId))
        return;

    getState(objId, async function (err, state) 
    {
        isNull(err)
            ? sendTo(TELEGRAM, "send",
                {
                    text: isNull(state?.val)
                        ? "Keine Daten"
                        : `${state.val} ${msg}`
                })
            : error(err);
    });
};

/**
* @param {string} objId
* @param {string} objIdAdd
* @param {string} msg
*/
async function sendBKProducedState(objId, objIdAdd, msg = "") 
{
    if (!isString(objId) || !isString(objIdAdd))
        return;

    var data;
    getState(objId, async function (err, state) 
    {
        if (!isNull(err)) 
        {
            error(err);
            return;
        }

        data = isNull(state?.val)
                ? 0.0
                : parseFloat(state.val);
    });

    getState(objIdAdd, async function (err, state) {
        isNull(err)
            ? sendTo(TELEGRAM, "send",
                {
                    text: isNull(state?.val)
                        ? ` ${data} ${msg}`
                        : `${(data + (parseFloat(state.val) * 0.001)).toFixed(2)} ${msg}`
                })
            : error(err);
    });
};

/**
* @param {string} text
* @param {string[][]} keyboard
*/
async function SendMenu(text, keyboard) 
{
    if (isNull(keyboard) || !isString(text)) 
    {
        error("Menu unvollständig konfiguriert!")
        return;
    }

    sendTo(TELEGRAM,
    {
        text: text,
        reply_markup:
        {
            keyboard: keyboard,
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
}

///////////
//Action

on({ id: TELEGRAM + '.communicate.request', change: "any" }, async function (obj) 
{
    if (isNull(obj?.state?.val))
        return;

    var request = obj.state.val.substring(obj.state.val.indexOf(']') + 1).toUpperCase();

    if (CONFIG[request] === undefined) 
    {
        await SendMenu(CONFIG.MENU.text, CONFIG.MENU.keyboard);
        return;
    }

    if (CONFIG[request].typ === "MENU") 
    {
        await SendMenu(CONFIG[request].text, CONFIG[request].keyboard);
        return;
    }

    if (CONFIG[request].typ === "ACTION") 
    {
        await CONFIG[request].action();
        return;
    }

    await SendMenu(CONFIG.MENU.text, CONFIG.MENU.keyboard);
});
