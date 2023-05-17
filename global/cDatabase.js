
class DB
{

    /**
    * @param {string} instance
    */
    constructor(instance)
    {
        if(!isString(instance))
            error("Fehlerhaftze Sql Instance übergeben")
        this.instance = instance;
    }

    /**
    * @param {string} query
    * @param {iobJS.MessageCallback | iobJS.MessageCallbackInfo} callback
    */
    execute(query, callback)
    {
        sendTo(this.instance,'query',query,callback); 
    }

    /**
    * @param {number} id
    * @param {{ getTime: () => string; }} date
    * @param {number} value
    */
    insertNumber(id,date,value)
    {
        sendTo(this.instance,'query','INSERT '+ 
        'INTO ts_number '+
        '(id, ts, val, ack, _from, q) '+
        'VALUES '+
        '('+id+' ,'+ date.getTime() +' ,'+ value +' ,1 ,4 ,0); COMMIT;'
        ,function (result) {
            console.log('result: ' + JSON.stringify(result));
            });
    }
   
    /**
    * @param {string} name
    * @param {(arg0: any) => void} [callback]
    */
    selectDataId(name, callback)
    {
        this.execute('SELECT id FROM datapoints WHERE name="'+ name +'"', function(result)
        {
            if(result.error)
            {
                error(result.error)    
            }
            else
            {
                callback(result.result[0].id);
            }
        });    
    }

    /**
    * @param {string} name
    * @param {Date} date
    * @param {(arg0: number, arg1: number) => void} callback
    */
    selectMaxNr(name, callback, date = getToday())
    {
        this.execute(
            'SELECT '+ 
                'val as max, '+
                'ts as time '+
            'FROM ts_number '+
            'WHERE '+
                'ts >= ' + date.getTime() + ' AND '+
                'id = (SELECT id FROM datapoints WHERE name="'+ name + '") ' + 
            'order by val DESC '+
            'LIMIT 1', 
        function (result) 
        {
            if(result.error)
            {
                error(result.error)    
            }
            else
            {
                callback(round(Number(result.result[0].max),2), Number(result.result[0].time));
            }    
        });    
    }
}
