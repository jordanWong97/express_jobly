const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Generates SQL necessary to update part of a database entry.
 * 
 *  Accepts an object containing new data values and object containing
 *  names of columns to be updated.
 * 
 *  Returns an object with string of parameterized queries to be inserted into 
 *  SQL statement and array of cooresponding values:
 * 
 * //TODO:provide sample parameters
 *
 *  {setCols:`'first_name'=$1, 'last_name'=$2, 'is_admin'=$3`, 
 *    values: ['James', 'McJames', 'false'],}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


/** Generates SQL query based on filter parameters from query string.
 * 
 * If no query string was provided in original request, returns object 
 * which will produce empty string in resulting SQL query. 
 * 
 * If query string was provided, returns object containing a string to be inserted
 * into SQL query and array of values :
 * { whereClause: `WHERE ...`, values: [nameLike, minEmployees, maxEmployees] }
 * 
 * */

//TODO: MOVE TO CLASS METHOD
function sqlForCompanyFilter(queryData) {

  const keys = Object.keys(queryData);
  if (keys.length === 0) return { whereClause: '', values: undefined };

  const { nameLike, minEmployees, maxEmployees } = queryData;

  const clauseArray = [];
  let idx = 1;

  //generate appropriate statement based on filter requested, push to array:
  if (nameLike !== undefined) {
    clauseArray.push(`name ILIKE $${idx}`);
    idx++;
  }
  if (minEmployees !== undefined) {
    clauseArray.push(`num_employees >= $${idx}`);
    idx++;
  }
  if (maxEmployees !== undefined) {
    clauseArray.push(`num_employees <= $${idx}`);
    idx++;
  }

  //add wildcards to value at nameLike key, if present:
  if (queryData.nameLike) queryData.nameLike = `%${nameLike}%`;

  //join WHERE clause from array of strings and
  //return object with clause and cooresponding values:
  return {
    whereClause: `WHERE ${clauseArray.join(' AND ')}`,
    values: Object.values(queryData),
  };

}



module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
