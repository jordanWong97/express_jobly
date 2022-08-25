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

      job.equity = Number(job.equity);
  
      return job;
    }



};

module.exports = Job;
