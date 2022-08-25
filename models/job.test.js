"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  idList
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


/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([{
      title: "test1",
      salary: 10000,
      equity: 0.005, //is this a string?
      company_handle: "c1",
    },
    {
      title: "test2",
      salary: 20000,
      equity: 0.075,
      company_handle: "c2"
    },
    {
      title: "test3",
      salary: 30000,
      equity: 0.025,
      company_handle: "c1"
    }
    ]);
  });

  test("works: with filter", async function () {
    const job = await Job.findAll({ titleLike: "test1" });
    expect(job).toEqual([{
      title: "test1",
      salary: 10000,
      equity: 0.005,
      company_handle: "c1",
    }]);
  });

  test("works: with filter, should return empty array", async function () {
    const job = await Job.findAll({ titleLike: "test4" });
    expect(job).toEqual([]);
  });

  test("works: with all filter", async function () {
    const job = await Job.findAll({
      titleLike: 'test1',
      minSalary: 10000,
      hasEquity: true
    });
    expect(job).toEqual([{
      title: "test1",
      salary: 10000,
      equity: 0.005,
      company_handle: "c1",
    }]);
  });

  test("works: all jobs with equity", async function () {
    const jobs = await Job.findAll({
      hasEquity: true
    });
    expect(jobs).toEqual([{
      title: "test1",
      salary: 10000,
      equity: 0.005,
      company_handle: "c1",
    },
    {
      title: "test2",
      salary: 20000,
      equity: 0.075,
      company_handle: "c2"
    },
    {
      title: "test3",
      salary: 30000,
      equity: 0.025,
      company_handle: "c1"
    }]);
  });

});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    //TODO: is this accessing the right thing/datatype?
    let job = await Job.get(idList.rows[0].id);
    expect(job).toEqual({
      title: "test1",
      salary: 10000,
      equity: 0.005,
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

// const newJob = {
//   title: "newJob",
//   salary: 10000,
//   equity: 0.123, //is this a string?
//   company_handle: "c1",
// };

describe("update", function () {
  const updateData = {
    title: "newJob",
    salary: 20000,
    equity: 0.123, //is this a string?
    company_handle: "c1",
  };

  test("works", async function () {

    let job = await Job.update("test1", updateData);
    expect(job).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});