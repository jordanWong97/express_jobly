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

module.exports = { sqlForPartialUpdate };
