
async function resetTodayProduced()
{
    getState(BK_PRODUCED_TODAY, async function (err, lastUpdate) 
    {
        if (!isNull(err)) 
        {
            error(err);
            return;
        }

        var date = getDateObject(lastUpdate.lc);
        var today = getToday();

        if (today > getDateStart(date)) 
        {
            setState(BK_PRODUCED_TODAY, 0, true);
            calcAndUpdateProduction(BK_PRODUCED_WEEK, addDays(today, -7));
            calcAndUpdateProduction(BK_PRODUCED_MONTH, new Date(today.getFullYear(),today.getMonth(),1));
            calcAndUpdateProduction(BK_PRODUCED_YEAR, new Date(today.getFullYear(),1,1));
            calcAndUpdateProduction(BK_PRODUCED_TOTAL, null);
        }
         
    });
}

/**
* @param {string} name
* @param {Date} start
*/
function calcAndUpdateProduction(name, start) 
{
    new DB(DB_INSTANCE).execute(
        "select " +
            "date((ts/1000),'unixepoch') as realdate, " +
            "max(val) as max " +
        "from ts_number " +
        "where " +
            (start === null ? "" :'ts >= ' + start.getTime() + ' AND ')+
            'id = (SELECT id FROM datapoints WHERE name="'+ BK_PRODUCED_TODAY + '") ' + 
        "group by realdate " +
        "order by realdate desc;", 
        function (result) 
        {
            if(result.error)
            {
                error(result.error)    
            }
            else
            {
                var total = 0;
                for(var i = 0; i < result.result.length; i++)
                {
                    total = total + round(Number(result.result[i].max),2);
                }
                setState(name, total, true); 
            }    
        });    
}

on({ id: BK_CURRENT_ENERGY, change: "any" }, async function (current) 
{
    await resetTodayProduced();
    
    var energy = Number(parseFloat(getState(BK_PRODUCED_LAST_READ).val).toFixed(2));
    var shelly = Number(current.state.val.toFixed(2));
    var today = Number(parseFloat(getState(BK_PRODUCED_TODAY).val).toFixed(2));

    if (energy === shelly)
        return;

    var newToday = today;
    if (energy > shelly) //bei reset
    {
        newToday += shelly;
    }
    else 
    {
        newToday += (shelly - energy);
    }

    if (newToday > today) 
    {
        setState(BK_PRODUCED_TODAY, round(newToday,2), true);
        setState(BK_PRODUCED_LAST_READ, shelly, true);
    }
});





