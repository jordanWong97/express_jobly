"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies that match query data.
   *  If no query data is provided, defaults to find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(queryData = {}) {

    const { whereClause, values } = Company._sqlForCompanyFilter(queryData);

    const querySql = `SELECT handle,
                              name,
                              description,
                              num_employees AS "numEmployees",
                              logo_url AS "logoUrl"
                          FROM companies
                          ${whereClause}
                          ORDER BY name`;

    const companiesRes = await db.query(querySql, values);
    return companiesRes.rows;

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {


    const companyRes = await db.query(
      `SELECT c.handle,
              c.name,
              c.description,
              c.num_employees AS "numEmployees",
              c.logo_url AS "logoUrl",
              j.id,
              j.title,
              j.salary,
              j.equity,
              j.company_handle AS "companyHandle"
           FROM companies AS c
            LEFT OUTER JOIN jobs AS j ON j.company_handle = c.handle
           WHERE c.handle = $1`,
      [handle]);

    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);

    let jobArray = [];

    if (companyRes.rows[0].id !== null) {
    jobArray = companyRes.rows.map(j => ({
      id: j.id,
      title: j.title,
      salary: j.salary,
      equity: j.equity,
      companyHandle: j.companyHandle
    }));
  }

    return {
      handle: company.handle,
      name: company.name,
      description: company.description,
      numEmployees: company.numEmployees,
      logoUrl: company.logoUrl,
      jobs: jobArray
    };
  }


  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
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

  static _sqlForCompanyFilter(queryData) {

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


}


module.exports = Company;
