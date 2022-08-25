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


module.exports = { sqlForPartialUpdate };
