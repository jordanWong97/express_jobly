"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
//const jobUpdateSchema = require("../schemas/jobUpdate.json");
//const jobFilterSchema = require("../schemas/jobFilter.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id,title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});


/** GET /  =>
 *   { jobs: [ { title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity (if true, filter jobs that provide non-zero amount)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  // const queryData = req.query;
  // if (queryData.minEmployees) {
  //   queryData.minEmployees = Number(queryData.minEmployees);
  // }
  // if (queryData.maxEmployees) {
  //   queryData.maxEmployees = Number(queryData.maxEmployees);
  // }

  // if (queryData.minEmployees > queryData.maxEmployees) {
  //   throw new BadRequestError("minEmployees cannot be greater than maxEmployees!");
  // }

  // const result = jsonschema.validate(
  //   queryData, companyFilterSchema, { required: true });

  // if (!result.valid) {
  //   const errs = result.errors.map(err => err.stack);
  //   throw new BadRequestError(errs);
  // }
  //queryData
  const jobs = await Job.findAll();
  return res.json({ jobs });

});


/** GET /[id]  =>  { job }
 *
 *  job is { title, salary, equity, company_handle }
 *
 * Authorization required: none
 */


router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

module.exports = router;