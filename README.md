# Document Validator
Validate and translate JSON objects for Document Databases like MongoDB or Amazon's DynamoDB.

## Installation
```
npm install --save @fyresite/document_validator
```

## Usage

### Writing Schema
Validations are handled using [@fyresite/object-validator](https://github.com/Fyresite/object-validator) and utilizes the [validator](https://www.npmjs.com/package/validator) node module.
``` javascript
module.exports = function (Types, Op) {
  return {
    "name": {
      "first": {
        "type": Types.STRING,
        "required": true
      },
      "middle": Types.STRING,
      "last": {
        "type": Types.STRING,
        "required": true
      }
    },
    validateField: {
      type: Types.STRING,
      validate: {
        "method": "matches",
        "pattern": "^([a-z ])+$"
      }
    },
    "myInt":{
      type: Types.INTEGER,
      "required": {
        myFloat:Op.eq(4.5)
      }
    },
    "myFloat": Types.FLOAT
    "email": {
      "type": Types.STRING,
      "required": true
    },
    "phone": {
      "type": Types.STRING,
      "required": true
    },
    "dob": {
      "type": Types.DATE,
      "required": true
    }
  }
}
```
### Synchronous Validation
``` javascript
var { Validator } = require('@fyresite/document_validator');

var userValidator = new Validator('user');

var userValid = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Jones"
  },
  "email": "email@example.com",
  "phone": "2813308004",
  "dob": new Date("1996-11-09")
};

var userInvalid = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Jones"
  },
  "email": "email@example.com",
  "phone": 344,
  "dob": new Date("1996-11-09"),
  "address": {
    "street": "2212 S Banner St",
    "street2":"Strong",
    "city": "Gilbert",
    "state": "AZ",
    "zip": 85296
  }
};

// Returns emptyObject {} signifying the document was valid
var invalidFields = userValidator.validate(userValid, 'v1');

// Returns object containing all of the validation errors that occurred
var invalidFields = userValidator.validate(userInvalid, 'v1');
```
### Asynchronous Validation
```javascript
var userValidator = new Validator('user', { schemaPath: 'schemas', isS3: true, bucket: 'model-schemas', profile: 'test-profile' });

var userValid = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Jones"
  },
  "email": "email@example.com",
  "phone": "2813308004",
  "dob": new Date("1996-11-09"),
  "_v" : 1
};

var userInvalid = {
  "name": {
    "first": "Mike",
    "middle": "T",
    "last": "Jones"
  },
  "email": "email@example.com",
  "phone": 344,
  "dob": new Date("1996-11-09"),
  "address": {
    "street": "2212 S Banner St",
    "street2":"Strong",
    "city": "Gilbert",
    "state": "AZ",
    "zip": 85296
  },
  "_v" : 1
};

userValidator.init()
  .then(() => {
    var invalidFields;

    // Returns emptyObject {} signifying the document was valid
    invalidFields = userValidator.validate(userValid, 'v1');

    // Returns object containing all of the validation errors that occurred
    invalidFields = userValidator.validate(userInvalid, 'v1');
  })
  .catch(err => {
    console.error(err);
  });
```
## API
<a name="Validator"></a>

## Validator
Class used validate and translate documents

**Kind**: global class

* [Validator](#Validator)
    * [new Validator(schemaName, [config])](#new_Validator_new)
    * [.init()](#Validator+init) ⇒ <code>Promise</code>
    * [.validate(document, version)](#Validator+validate) ⇒ <code>Object</code>
    * [.translate(document, version)](#Validator+translate) ⇒ <code>Object</code>

<a name="new_Validator_new"></a>

### new Validator(schemaName, [config])
Create a validator.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| schemaName | <code>string</code> |  | Name of the schema to validate. |
| [config] | <code>Object</code> |  | Custom configuration options. |
| config.schemaPath | <code>string</code> | <code>&quot;APP_ROOT/schemas&quot;</code> | the path to the schemas folder |
| config.isS3 | <code>boolean</code> | <code>true</code> | Define if schema location is a s3 bucket |
| config.s3Bucket | <code>string</code> |  | Name of the s3 bucket to connect the schemas are located |
| config.awsProfile | <code>string</code> |  | The AWS Profile you want to use to connect to the bucket |

<a name="Validator+init"></a>

### validator.init() ⇒ <code>Promise</code>
Used to fetch schema from s3, the instance validate function must be used inside .then() to guarantee that schemas are loaded before validating

**Kind**: instance method of [<code>Validator</code>](#Validator)
<a name="Validator+validate"></a>

### validator.validate(document, version) ⇒ <code>Object</code>
Validates document against specific version of the schema

**Kind**: instance method of [<code>Validator</code>](#Validator)

| Param | Type | Description |
| --- | --- | --- |
| document | <code>Object</code> | Document to be validated |
| version | <code>string</code> | version to be validated. |

<a name="Validator+translate"></a>

### validator.translate(document, version) ⇒ <code>Object</code>
Translates document to version specified
the documents version is automatically read through the _v property on the document

**Kind**: instance method of [<code>Validator</code>](#Validator)

| Param | Type | Description |
| --- | --- | --- |
| document | <code>Object</code> | Document to be validated |
| version | <code>string</code> | version to be translated to. |


### Schema
Defines the validation rules that will be applied to the document using the Validator
``` javascript
// Export a function (Types, Op) that returns a json
module.exports = function(Types, Op) {
  return {
    /*
    Fields can be defined by setting the ket to the field
    name and the type as the value
    */
    fieldName: Types.STRING

    // Or pass an object for more advanced options

    advancedField: {
      type: Types.INTEGER, //Type of field *required*

      /*
      flag that tells validator to return error if field is not provided.
      The value can be
      */
      required: true,

      //Default value to use if field is not provided
      default: 0,

      /*
        Validation object that is used for advanced validation. Methods are based on the validator npm package by cohara87.

        For further documentation refer to @fyresite/object_validator
      */
      validate: {
        "method": "validator method", /** String **/
        "param1": value,
        "param2": value
      }
    }
  }
}

```

#### Using Conditional require statements in schema
An function can be passed
``` javascript
module.exports = function(Types, Op) {
  return {
    field1 : Types.NUMBER
  }
}
```

## Types

* [Types.STRING]()
* [Types.INTEGER]()
* [Types.FLOAT]()
* [Types.NUMBER]()
* [Types.OBJECT]()
* [Types.DATE]()
* [Types.BOOLEAN]()

<a name="Op"></a>

## Op
Class used to provide conditions to require flags

**Kind**: global class

* [Op](#Op)
    * [.any(conditions)](#Op.any) ⇒ <code>function</code>
    * [.not(opFunction)](#Op.not) ⇒ <code>function</code>
    * [.set()](#Op.set) ⇒ <code>function</code>
    * [.eq(value)](#Op.eq) ⇒ <code>function</code>
    * [.gt(value)](#Op.gt) ⇒ <code>function</code>
    * [.gte(value)](#Op.gte) ⇒ <code>function</code>
    * [.lt(value)](#Op.lt) ⇒ <code>function</code>
    * [.lte(value)](#Op.lte) ⇒ <code>function</code>

<a name="Op.any"></a>

### Op.any(conditions) ⇒ <code>function</code>
Checks if the documents value matches any of the conditions

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type | Description |
| --- | --- | --- |
| conditions | <code>array</code> | Array of conditions to match on the Op functions are valid conditions |

<a name="Op.not"></a>

### Op.not(opFunction) ⇒ <code>function</code>
Accepts Op Function and returns opposite value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type | Description |
| --- | --- | --- |
| opFunction | <code>function</code> | valid Op function |

<a name="Op.set"></a>

### Op.set() ⇒ <code>function</code>
Checks if field is set

**Kind**: static method of [<code>Op</code>](#Op)
<a name="Op.eq"></a>

### Op.eq(value) ⇒ <code>function</code>
Checks if field equals value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type |
| --- | --- |
| value | <code>number</code> \| <code>string</code> \| <code>boolean</code> |

<a name="Op.gt"></a>

### Op.gt(value) ⇒ <code>function</code>
Checks if fields value is greater than the provided value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type |
| --- | --- |
| value | <code>number</code> |

<a name="Op.gte"></a>

### Op.gte(value) ⇒ <code>function</code>
Checks if fields value is greater than or equal to provided value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type |
| --- | --- |
| value | <code>number</code> |

<a name="Op.lt"></a>

### Op.lt(value) ⇒ <code>function</code>
Checks if fields value is less than the provided value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type |
| --- | --- |
| value | <code>number</code> |

<a name="Op.lte"></a>

### Op.lte(value) ⇒ <code>function</code>
Checks if fields value is less than or equal to provided value

**Kind**: static method of [<code>Op</code>](#Op)

| Param | Type |
| --- | --- |
| value | <code>number</code> |

