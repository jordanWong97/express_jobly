"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

// Make sure company_handle is accurate to data being passed in

describe("create", function () {
    const newJob = {
      title: "newJob",
      salary: 10000,
      equity: 0.123, //is this a string?
      company_handle: "c1",
    };
  
    test("works", async function () {
      let job = await Job.create(newjob);
      expect(job).toEqual(newjob); // tests JSON returned by function matches what we entered
  
      const result = await db.query(
        `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE company_handle = 'c1'`);
      expect(result.rows).toEqual([
        {
            title: "newJob",
            salary: 10000,
            equity: 0.123, //is this a string?
            company_handle: "c1",
        },
      ]);
    });
  
    test("bad request with dupe", async function () {
      try {
        await Job.create(newJob);
        await Job.create(newJob);
        throw new Error("fail test, you shouldn't get here");
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });


/**************************************  */



/**************************************  */



/**************************************  */