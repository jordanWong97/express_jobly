"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, handle }
     *
     * Returns { id, title, salary, equity, handle }
     *
     * */

    static async create({ title, salary, equity, company_handle }) {

        const result = await db.query(
            `INSERT INTO jobs(
            title,
            salary,
            equity,
            company_handle)
            VALUES
               ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [
                title,
                salary,
                equity,
                company_handle
            ],
        );

        const job = result.rows[0];

        // job.equity = Number(job.equity);

        return job;
    }

    /** Find all jobs that match query data.
    *  If no query data is provided, defaults to find all jobs.
    *
    * Returns [{ id, title, salary, equity, company_handle}, ...]
    * */

    static async findAll(queryData = {}) {

        const { whereClause, values } = Job._sqlForJobFilter(queryData);

        const querySql = `SELECT id,
                                title,
                                salary,
                                equity,
                                company_handle
                            FROM jobs
                            ${whereClause}
                            ORDER BY id`;

        const companiesRes = await db.query(querySql, values);
        return companiesRes.rows;

    }

    /** Given a job id, return data about that job.
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {

        const jobRes = await db.query(
            `SELECT id,
                title,
                salary,
                equity,
                company_handle
           FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }





    /** Update job data with `data`.
 *
 * This is a "partial update" --- it's fine if data doesn't contain all the
 * fields; this only changes provided ones.
 *
 * Data can include: { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Throws NotFoundError if not found.
 */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                numEmployees: "num_employees",
                logoUrl: "logo_url",
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE jobs
                SET ${setCols}
                WHERE id = ${idVarIdx}
                RETURNING id,
                        title,
                        salary,
                        equity,
                        company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
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

   static _sqlForJobFilter(queryData) {

    const keys = Object.keys(queryData);
    if (keys.length === 0) return { whereClause: '', values: undefined };

    const { titleLike, minSalary, hasEquity } = queryData;

    const resultObject = {};

    const clauseArray = [];
    let idx = 1;

    //generate appropriate statement based on filter requested, push to array:
    if (titleLike !== undefined) {
      clauseArray.push(`title ILIKE $${idx}`);
      resultObject.titleLike = titleLike;
      idx++;
    }
    if (minSalary !== undefined) {
      clauseArray.push(`salary >= $${idx}`);
      resultObject.minSalary = minSalary;
      idx++;
    }
    if (hasEquity === true) {
      clauseArray.push(`equity >= 0`);
    }

    //add wildcards to value at titleLike key, if present:
    if (resultObject.titleLike) resultObject.titleLike = `%${titleLike}%`;

    //join WHERE clause from array of strings and
    //return object with clause and cooresponding values:
    return {
      whereClause: `WHERE ${clauseArray.join(' AND ')}`,
      values: Object.values(resultObject),
    };

  }

};

module.exports = Job;
