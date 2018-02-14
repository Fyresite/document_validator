var objectPath = require("object-path");
var cloneDeep = require("lodash.clonedeep");
class Transformer {
    constructor (document,schema) {
        this.document = document
        this.schema = schema
        this.newDoc = cloneDeep(this.document)
    }

    addFields(fields) {
        fields.forEach(field => {
            objectPath.set(this.newDoc,field, objectPath.get(this.schema,field).default)
        })
    }

    removeFields(fields) {
        fields.forEach(field => {
            objectPath.del(this.newDoc, field)
        })
    }
    
    renameFields(fields) {
        Object.keys(fields).forEach(key => {
            if (objectPath.has(this.newDoc,key)){
                objectPath.set(this.newDoc,  fields[key], objectPath.get(this.newDoc, key));
                objectPath.del(this.newDoc, key);
            }
        })
    }

    finalize() {
        return this.newDoc;
    }

}

module.exports = Transformer