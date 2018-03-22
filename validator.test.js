var Validator = require('./validator');

var userV1 = require('./test_schema/user/schema/v1.js');
var userV2 = require('./test_schema/user/schema/v2.js');

var userVersions = {
    'v1': userV1,
    'v2': userV2
}

var userV1_V2 = require('./test_schema/user/translation/v1.js');

var userTranslators = {
    'v1': userV1_V2
}

var userValidator = new Validator(userVersions, userTranslators);

var userValid = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": new Date("1996-11-09"),
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userValid2 = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Strong"
  },
  validateField:"mike",
  myInt:2,
  myFloat:3.5,
  myArray: [38,384],
  "email": "email@example.com",
  "phone": "5555555555",
  "dob": new Date("1996-11-09"),
  "address": {
    "street": "2212 S Banner St",
    "street2":"Strong",
    "city": "Gilbert",
    "state": "AZ",
    "zip": 85296
  }
};

var userValid3 = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Strong"
  },
  validateField:"mike",
  myFloat:4.2,
  "email": "email@example.com",
  "phone": "5555555555",
  "dob": new Date("1996-11-09"),
  "address": {
    "street": "2212 S Banner St",
    "street2":"Strong",
    "city": "Gilbert",
    "state": "AZ",
    "zip": 85296
  }
};

var userInvalid1 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2,
    myFloat:3.5,
    "email": 3648,
    "phone": "5555555555",
    "dob": new Date("1996-11-09"),
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userInvalid2 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": new Date("1996-11-09"),
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": "85296"
    }
};

var userInvalid3 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": "1996-11-09",
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userInvalid4 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2,
    myFloat:3,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": "1996-11-09",
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userInvalid5 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2.7,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": "1996-11-09",
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userInvalid6 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    validateField:"mIKE",
    myInt:2.7,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": "1996-11-09",
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    }
};

var userTranslationV1 = {
    "name": {
      "first": "Mike",
      "middle": "T",
      "last": "Strong"
    },
    myInt:2.7,
    myFloat:3.5,
    "email": "email@example.com",
    "phone": "5555555555",
    "dob": "1996-11-09",
    "address": {
      "street": "2212 S Banner St",
      "street2":"Strong",
      "city": "Gilbert",
      "state": "AZ",
      "zip": 85296
    },
    _v:1
};

var userUpdate = {
    status: "active"
}
var userUpdateBad = {
  status: "pie"
}
var userUpdateInvalid = {
    foo: "bar"
}

test('valid schema', () => {
  expect(userValidator.validate(userValid, 'v1')).toEqual({});
});

test('valid schema (validate)', () => {

  expect(userValidator.validate(userValid2, 'v1')).toEqual({});
});

test('valid schema update', () => {
  expect(userValidator.validateKeys(userUpdate, 'v1')).toEqual({});
});

test('invalid schema update', () => {
  expect(userValidator.validateKeys(userUpdateInvalid, 'v1')).not.toEqual({});
});

test('invalid schema update (bad op)', () => {
  expect(userValidator.validateKeys(userUpdateBad, 'v1')).not.toEqual({});
});

test('invalid schema (top level)', () => {
  expect(userValidator.validate(userInvalid1, 'v1')).not.toEqual({});
});

test('invalid schema (nested)', () => {
  expect(userValidator.validate(userInvalid2, 'v1')).not.toEqual({});
});

test('invalid schema (date)', () => {
  expect(userValidator.validate(userInvalid3, 'v1')).not.toEqual({});
});

test('invalid schema (float)', () => {
  expect(userValidator.validate(userInvalid4, 'v1')).not.toEqual({});
});

test('invalid schema (int)', () => {
  expect(userValidator.validate(userInvalid5, 'v1')).not.toEqual({});
});

test('invalid schema (validate)', () => {
  expect(userValidator.validate(userInvalid6, 'v1')).not.toEqual({});
});

test('valid schema missing required', () => {
  expect(userValidator.validate(userValid3, 'v1')).toEqual({});
});

test('translation v1 to v2', () => {
  let newDoc = userValidator.translate(userTranslationV1, 'v2');

  expect(newDoc).toBeTruthy();
});
