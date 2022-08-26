"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4TokenAdmin,
  jobIDList
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "test4",
    salary: 40000,
    equity: .004,
    company_handle: 'c1',
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4TokenAdmin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "test4",
        salary: 40000,
        equity: "0.004",
        company_handle: 'c1',
      }
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Must be admin",
        status: 401,
      }
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      }
    });
  });

  test("bad request with missing data, admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 50000,
      })
      .set("authorization", `Bearer ${u4TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data, admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u4TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "testJob",
            salary: 10000,
            equity: "0.001",
            company_handle: "c1"
          },
          {
            id: expect.any(Number),
            title: "testJob2",
            salary: 20000,
            equity: "0.002",
            company_handle: "c2"
          },
          {
            id: expect.any(Number),
            title: "testJob3",
            salary: 30000,
            equity: "0.003",
            company_handle: "c3"
          }
        ],
    });
  });

  // test("invalid: min is greater than max", async function () {
  //   try {
  //     // await Company.findAll({ minEmployees: 10, maxEmployees: 5 });
  //     const response = await request(app)
  //       .get("/companies")
  //       .query({ minEmployees: 10, maxEmployees: 5 });
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });

  // test("valid query keys for filter", async function () {
  //   const resp = await request(app).get("/companies").query({ nameLike: 'C2' });
  //   expect(resp.body).toEqual({
  //     companies: [{
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img"
  //     }]

  //   });
  // });

  // test("invalid query keys for filter", async function () {
  //   const resp = await request(app).get("/companies").query({ username: 'C2' });;
  //   expect(resp.status).toEqual(400);
  //   expect(resp.body.error).toBeTruthy();
  // });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });


  /************************************** GET /jobs/:handle */

  describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const id = jobIDList[0];
      console.log(jobIDList);
      const resp = await request(app).get(`/jobs/${id}`);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "testJob",
          salary: 10000,
          equity: "0.001",
          company_handle: "c1"
        },
      });
    });

    // test("works for anon: company w/o jobs", async function () {
    //   const resp = await request(app).get(`/jobs/c2`);
    //   expect(resp.body).toEqual({
    //     company: {
    //       handle: "c2",
    //       name: "C2",
    //       description: "Desc2",
    //       numEmployees: 2,
    //       logoUrl: "http://c2.img",
    //     },
    //   });
    // });

    test("not found for no such company", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });


});