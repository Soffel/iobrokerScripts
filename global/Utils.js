///////////
//Log Utils

/**
* @param {any} obj
*/
function log(obj) { console.log(obj) }
/**
* @param {string} obj
*/
function error(obj) { console.error(obj) }


///////////
//Basic Utils

/**
* @param {string} msg
* @param {string} pattern
* @param {string} replacement
*/
function replaceAll(msg,pattern,replacement){ return msg.split(pattern).join(replacement)}

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
//Math Utils

/**
* @param {number} x
* @param {number} n
*/
function round(x, n)  
{  
  var a = Math.pow(10, n);  
  return (Math.round(x * a) / a);  
}

///////////
//Date Utils

function getNow() {return new Date();}

function getToday() {return getDateStart(getNow())}

/**
* @param {Date} date
*/
function getDateStart(date)
{
    return new Date(date.getFullYear(),date.getMonth(), date.getDate(),0,0,0)
}

/**
* @param {Date} date
* @param {number} days
*/
function addDays(date,days) 
{
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}