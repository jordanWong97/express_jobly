"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, handle }
     *
     * Returns { title, salary, equity, handle }
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
            RETURNING title, salary, equity, company_handle`,
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

        //const { whereClause, values } = Company._sqlForCompanyFilter(queryData);

        const querySql = `SELECT id,
                                title,
                                salary,
                                equity,
                                company_handle
                            FROM jobs
                            ORDER BY id`;
        //${whereClause}

        const companiesRes = await db.query(querySql);



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

};

module.exports = Job;
