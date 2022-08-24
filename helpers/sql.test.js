const { sqlForPartialUpdate } = require('./sql');

describe("createToken", function () {
  test("valid: sqlForPartialUpdate", function () {

    const data = {
      firstName: "edmond",
      lastName: "soun",
      isAdmin: "true",
    };

    const result = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      }
    );

    expect(result).toEqual({
      setCols: `"first_name"=$1, "last_name"=$2, "is_admin"=$3`,
      values: ['edmond', 'soun', 'true']
    });

  });

  test("invalid: no data", function () {

    const data = {};

    const columns = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    expect(() => sqlForPartialUpdate(data, columns)).toThrow(Error);

  });

  //TODO: pass in partial data
});


