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
        equity: "0.123",
        company_handle: "c3",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob); // tests JSON returned by function matches what we entered

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE company_handle = 'c3'`);
        expect(result.rows).toEqual([
            {
                title: "newJob",
                salary: 10000,
                equity: "0.123",
                company_handle: "c3",
            },
        ]);
    });

    // TODO: Do we need a dupe test? Is it okay to have multiple of the same job listing?
    // test("bad request with dupe", async function () {
    //     try {
    //         await Job.create(newJob);
    //         await Job.create(newJob);
    //         throw new Error("fail test, you shouldn't get here");
    //     } catch (err) {
    //         expect(err instanceof BadRequestError).toBeTruthy();
    //     }
    // });

});


// /************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([{
            id: expect.any(Number),
            title: "test1",
            salary: 10000,
            equity: "0.005", //is this a string?
            company_handle: "c1",
        },
        {
            id: expect.any(Number),
            title: "test2",
            salary: 20000,
            equity: "0.075",
            company_handle: "c2"
        },
        {
            id: expect.any(Number),
            title: "test3",
            salary: 30000,
            equity: "0.025",
            company_handle: "c1"
        }
        ]);
    });

    //     test("works: with filter", async function () {
    //         const job = await Job.findAll({ titleLike: "test1" });
    //         expect(job).toEqual([{
    //             title: "test1",
    //             salary: 10000,
    //             equity: 0.005,
    //             company_handle: "c1",
    //         }]);
    //     });

    //     test("works: with filter, should return empty array", async function () {
    //         const job = await Job.findAll({ titleLike: "test4" });
    //         expect(job).toEqual([]);
    //     });

    //     test("works: with all filter", async function () {
    //         const job = await Job.findAll({
    //             titleLike: 'test1',
    //             minSalary: 10000,
    //             hasEquity: true
    //         });
    //         expect(job).toEqual([{
    //             title: "test1",
    //             salary: 10000,
    //             equity: 0.005,
    //             company_handle: "c1",
    //         }]);
    //     });

    //     test("works: all jobs with equity", async function () {
    //         const jobs = await Job.findAll({
    //             hasEquity: true
    //         });
    //         expect(jobs).toEqual([{
    //             title: "test1",
    //             salary: 10000,
    //             equity: 0.005,
    //             company_handle: "c1",
    //         },
    //         {
    //             title: "test2",
    //             salary: 20000,
    //             equity: 0.075,
    //             company_handle: "c2"
    //         },
    //         {
    //             title: "test3",
    //             salary: 30000,
    //             equity: 0.025,
    //             company_handle: "c1"
    //         }]);
    //     });

});


// /************************************** get */

describe("get", function () {
    test("works", async function () {

        const id = idList[0].rows[0].id;

        let job = await Job.get(id);
        expect(job).toEqual({
            id,
            title: "test1",
            salary: 10000,
            equity: "0.005",
            company_handle: "c1",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

// /************************************** update */

describe("update", function () {
    const updateData = {
        title: "newJob",
        salary: 20000,
        equity: "0.123", //is this a string?
        company_handle: "c1",
    };

    test("works", async function () {

        const id = idList[0].rows[0].id;

        let job = await Job.update(id, updateData);


        expect(job).toEqual({
            id,
            ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${id}`);

        expect(result.rows).toEqual([{
            id,
            title: "newJob",
            salary: 20000,
            equity: "0.123",
            company_handle: "c1",
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "newJob",
            salary: null,
            equity: null,
            company_handle: "c1",
        };

        const id = idList[0].rows[0].id;

        let job = await Job.update(id, updateDataSetNulls); // check against how we want returned data to read
        expect(job).toEqual({
            id: id,
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${id}`);

        expect(result.rows).toEqual([{
            title: "newJob",
            salary: null,
            equity: null,
            company_handle: "c1",
        }]);
    });

    test("not found if no such company", async function () {
        try {
            await Job.update(0, updateData);
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {

        const id = idList[0].rows[0].id;

        try {
            await Job.update(id, {});
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

});

// /************************************** remove */

describe("remove", function () {
    test("works", async function () {

        const id = idList[0].rows[0].id;

        await Job.remove(id);
        const res = await db.query(
            `SELECT title FROM jobs WHERE id=${id}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
