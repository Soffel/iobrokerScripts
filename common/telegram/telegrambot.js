///////////
//Config

var status = "none";

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
////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////
    "BALKONKRAFTWERK": {
        typ: "MENU",
        text: "Balkonkraftwerk Menu:",
        keyboard:
            [
                ["Balkonkraftwerk Jetzt"],
                ["Balkonkraftwerk Heute"],
                ["Balkonkraftwerk Woche"],
                ["Balkonkraftwerk Monat"],
                ["Balkonkraftwerk Jahr"],
                ["Balkonkraftwerk Gesamt"]
            ]
    },
    "BALKONKRAFTWERK JETZT": {
        typ: "ACTION",
        action: async function () 
        { 
            getState(BK_CURRENT_POWER, async function (err, state) 
            {
                if(!isNull(err))
                {
                    error(err);
                    return;
                }

               await sendMsg(isNull(state?.val)
                            ? "Keine Daten"
                            : `${state.val} W`
                       );
            });      
        },
    },
    "BALKONKRAFTWERK HEUTE": {
        typ: "ACTION",
        action: async function () 
        { 
            var db = new DB(DB_INSTANCE);
            getState(BK_PRODUCED_TODAY, async function (err, state) 
            {
                if(!isNull(err))
                {
                    error(err);
                    return;
                }
                var prdouced = "Keine Daten";
                var price = "Keine Daten";

                getState(SZ_PRICE, async function (err, szprice) 
                {
                    if(!isNull(state?.val))
                    {
                        prdouced = `${state.val} Wh`;
                        price = `${round((((state.val / 1000) * szprice.val) / 100),3)} €`
                    }
                });
            
                db.selectMaxNr(BK_CURRENT_POWER,function(/** @type {number} */ max, /** @type {number} */ time)
                {
                    var datetime = new Date(time);
                    sendMsg("Produziert: "+ prdouced +"\r\n"+
                            "Ertrag: "+price +"\r\n"+
                            "Max: "+ max +" W um "+datetime.toLocaleTimeString()+ " Uhr");
                }, getToday())            
            }); 
        }
    },  
    "BALKONKRAFTWERK WOCHE": {
        typ: "ACTION",
      action: async function () { return await sendBKProducedState(BK_PRODUCED_WEEK, BK_PRODUCED_TODAY, "kWh"); },
    },
    "BALKONKRAFTWERK MONAT": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_MONTH, BK_PRODUCED_TODAY, "kWh"); },
    },
    "BALKONKRAFTWERK JAHR": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_YEAR, BK_PRODUCED_TODAY, "kWh"); },
    },
    "BALKONKRAFTWERK GESAMT": {
        typ: "ACTION",
        action: async function () { return await sendBKProducedState(BK_PRODUCED_TOTAL, BK_PRODUCED_TODAY, "kWh"); },
    },

////////////////////////////////////////////////////////////////////
    "STROMZÄHLER": {
        typ: "MENU",
        text: "Stromzähler Menu:",
        keyboard:
            [
                ["Letzte Werte"],
                ["Neue Werte eingeben"],
            ]
    },
    "LETZTE WERTE":{
        typ: "ACTION",
        action: async function () 
        { 
             var verb = getState(SZ_OUT);
             var date = getDateObject(verb.lc)
             var einspeisung = Number(parseFloat(getState(SZ_IN).val).toFixed(2));
             var verbrauch   = Number(parseFloat(verb.val).toFixed(2));

             sendMsg("Verbrauch: "+ verbrauch+" kWh\r\n"+
                     "Einspeisung: "+ einspeisung+" kWh\r\n"+
                     "Stand: "+ date.toLocaleDateString())
        },
    },
    "NEUE WERTE EINGEBEN":{
        typ: "ACTION",
        action: async function () 
        { 
           status = "NeueWerteStrom";
           sendMsg("Warte auf Werte \r\n <Verbrauch>#<Einspeisung>")
        },
    },  
};


///////////
//Telegram

/**
* @param {string} msg
*/
async function sendMsg(msg) 
{
    if (!isString(msg))
        return;

    sendTo(TELEGRAM_INSTANCE, "send",{text: replaceAll(msg,".",",")})
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

    getState(objId, async function (err, state) 
    {
        if(!isNull(err))
        {
            error(err);
            return;
        }

        var total = state.val;
        
        if(!isNull(state?.val))
        {
            getState(objIdAdd, async function (err, prodToday) 
            {
                if(isNull(err))
                {
                    total = total + prodToday.val;
                }
                else
                    error(err);

                total = total / 1000;
                  
                getState(SZ_PRICE, async function (err, szprice) 
                { 
                    var pricedata = "<<Keine Daten>>";
                    if(isNull(err))
                    {
                        pricedata = `${round(((total  * szprice.val) / 100),3)} €`    
                    }
                    else
                        error(err);

                    sendMsg(`Produziert: ${round(total,3)} ${msg}\r\n`+
                            "Ertrag: "+ pricedata);            
                }); 
            });       
        }
        else
        {
            sendMsg("Produziert: <<Keine Daten>> \r\n"+
                    "Ertrag: <<Keine Daten>>" );
        }          
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

    sendTo(TELEGRAM_INSTANCE,
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
//Status Actions

/**
* @param {string} request
*/
async function handleStatus(request)
{
    switch(status)
    {
        case "NeueWerteStrom":

            if(request.includes("#"))
            {
                var werte = request.replace(',','.').split("#");    
               
                if(werte.length == 2)
                {
                    var verbrauch = Number(parseFloat(werte[0]).toFixed(2));
                    var einspeisung = Number(parseFloat(werte[1]).toFixed(2));

                    var einspeisungAlt = Number(parseFloat(getState(SZ_IN).val).toFixed(2));
                    var verbrauchAlt = Number(parseFloat(getState(SZ_OUT).val).toFixed(2));

                    if(verbrauch > verbrauchAlt)
                        setState(SZ_OUT, verbrauch, true);

                     if(einspeisung > einspeisungAlt)
                        setState(SZ_IN, einspeisung, true);

                    status = "none";
                    return;
                }  
            }
            sendMsg("Eingabe Fehlerhaft!");
        break;
        
        default:
            error("Unbekannter Status: "+ status);
            status = "none";
    }
}

///////////
//Action

on({ id: TELEGRAM_INSTANCE + '.communicate.request', change: "any" }, async function (obj) 
{
    if (isNull(obj?.state?.val))
        return;

    var request = obj.state.val.substring(obj.state.val.indexOf(']') + 1).toUpperCase();

    if(status !== "none" )
    {
        handleStatus(request);
        return;
    }
   
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





