module.exports = function (Types) {
  return {
    "name": {
      "first": {
        "type": "STRING",
        "required": true
      },
      "middle": "STRING",
      "last": {
        "type": "STRING",
        "required": true
      },
      added_field2:{
        type: "INTEGER",
        required: true,
        default: 6
      }
    },
    added_field:{
        type: "FLOAT",
        required: true,
        default: 2.5
    },
    "myInt":{
      type: "INTEGER",
      "required": true
    },
    "email": {
      "type": "STRING",
      "required": true
    },
    "phone": {
      "type": "STRING",
      "required": true
    },
    "dob": {
      "type": "DATE",
      "required": true
    },
    "address": {
      "street": {
        "type": "STRING",
        "required": true
      },
      "street2": "STRING",
      "city": {
        "type": "STRING",
        "required": true
      },
      "state": {
        "type": "STRING",
        "required": true
      },
      "zip": {
        "type": "NUMBER",
        "required": true
      }
    }
  }
}