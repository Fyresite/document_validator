module.exports = function (Types,Op) {
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
    myArray:Types.ARRAY,
    validateField: {
      type:Types.STRING,
      validate: {
        "method": "matches",
        "pattern": "^([a-z ])+$"
      }
    },
    "status": {
      type: Types.STRING,
      default: "pending",
      op: Op.any(['pending', 'active', 'deactivated', 'on hold'])
    },

    "myInt":{
      type: Types.INTEGER,
      "required": {
        myFloat:Op.eq(4.5)
      }
    },
    "myFloat":{
      type:Types.FLOAT
    },
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
    },
    "address": {
      "street": {
        "type": Types.STRING,
        "required": true
      },
      "street2": Types.STRING,
      "city": {
        "type": Types.STRING,
        "required": true
      },
      "state": {
        "type": Types.STRING,
        "required": true
      },
      "zip": {
        "type": Types.NUMBER,
        "required": true
      }
    }
  }
}