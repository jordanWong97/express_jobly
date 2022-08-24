const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** Receives req.body and an object containing key/value pairs that map js keys
 * to sql column names.
 * Grabs keys from req.body, if none throws error.
 * Maps over keys to generate an array of strings of parameterized queries.
 * Returns an object with setCols, a single string of all parameterized queries
 * and values, an array of values from req.body.
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


/** TODO: Docstring */

function sqlForCompanyFilter(queryData) {
  
  const keys = Object.keys(queryData);
  if (keys.length === 0) return {whereClause: '', values: undefined};

  const {name, minEmployees, maxEmployees} = queryData;

  if (parseInt(minEmployees) > parseInt(maxEmployees)) {
    throw new BadRequestError("minEmployees cannot be greater than maxEmployees!");
  }

  const clauseArray = [];
  let idx = 1;
  
  //generate appropriate statement based on filter requested, push to array:
  for (let key in queryData) {
    if (key === 'name') {
      clauseArray.push(`name ILIKE $${idx}`);
      idx++;
    }
    if (key === 'minEmployees') {
      clauseArray.push(`num_employees > $${idx}`);
      idx++;
    }
    if (key === 'maxEmployees') {
      clauseArray.push(`num_employees < $${idx}`); 
      idx++;
    }
  }

  //add wildcards to value at name key, if present:
  if (queryData.name) queryData.name = `%${name}%`;
  

  //join WHERE clause from array of strings and 
  //return object with clause and cooresponding values:
  return {
    whereClause: `WHERE ${clauseArray.join(' AND ')}`,
    values: Object.values(queryData),
  }

}



module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
