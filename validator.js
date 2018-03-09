var objectValidator = require('@fyresite/object-validator');

var Types = require('./types');
var Op = require('./op');
var Transformer = require('./transformer');

/** Class used validate and translate documents */
class Validator {
    /**
     * Create a validator.
     * @param {Object} schemas - Schemas to validate against
     * @param {Object} [translations] - Version translation object with migration functions
     */
    constructor(schemas, translations={}) {
        this.schemas = {};
        this.translations = translations;

        Object.keys(schemas).forEach(item => {
          let version = item[item.length - 2];
          this.schemas[version] = schemas[item](Types, Op);
        });

        Object.keys(translations).forEach(item => {
          let version = item[item.length - 2];
          this.translations[version] = translations[item];
        });
    }

    /**
     * Validates document against specific version of the schema
     * @param {Object} document - Document to be validated
     * @param {string} version - version to be validated.
     * @returns {Object}
     */
    validate(document, version) {
        let schema = this.schemas[version];
        let errors = {};

        Object.keys(schema).map(fieldName => {
            let field = schema[fieldName];
            if (typeof field === 'object' && !field.type) {
                let result = validateSecondary(document[fieldName] || {}, field);
                if (Object.keys(result).length > 0) {
                    errors[fieldName] = result;
                }
            } else {
                let result = validateField(schema[fieldName],document[fieldName], fieldName, document);
                if (result.length > 0) {
                    errors[fieldName] = result;
                }
            }
        });
        return errors;
    }

    /**
     * Validates keys for document against specific version of the schema
     * @param {Object} fields - Document to be validated
     * @param {string} version - version to be validated.
     * @returns {Object}
     */
    validateKeys(fields, version) {
        let schema = this.schemas[version];
        let errors = {};

        Object.keys(fields).map(fieldName => {
            let fieldSchema = schema[fieldName]
            let fieldData = fields[fieldName]
            if(fieldSchema){
                Object.keys(fieldSchema).forEach(key => {
                    let rule = fieldSchema[key];
                    switch (key) {
                        case 'type':
                            validateType(fieldName, fieldData, rule, errors);
                            break;
                        case 'op':
                            if(typeof rule === 'function') {
                                if (!rule(fieldName, fields)) {
                                    errors[fieldName] = `${fieldName} failed its op check`;
                                }
                            } else {
                                errors[fieldName] = `${fieldName}'s schema contains invalid op function`;
                            }
                            break;
                        case 'validate':
                            if (!objectValidator(rule, fieldData)) {
                                errors[fieldName] = `${fieldName} does not match validation rules defined in schema`;
                            }
                            break;
                    }
                });
            } else {
                errors[fieldName] = `${fieldName} Is not a valid field`;
            }

        });
        return errors;
    }
    /**
     * Translates document to version specified
     * the documents version is automatically read through the _v property on the document
     * @param {Object} document - Document to be validated
     * @param {string} version - version to be translated to.
     * @returns {Object}
     */
    translate(document, version) {
        let v = parseInt(version.split('')[1]);
        let newDoc = Object.assign({},document);

        if (!this.schemas[version]) {
            return false;
        }

        if (document._v < v) {
            for( var i = document._v; i <= v; i++) {
                document = this.translations[`v${document._v}`].up(new Transformer(document,this.schemas[version]));
            }
        } else if (document._v > v) {
            for( var i = v; i < document._v; i++) {
                document = this.translations[version].down(new Transformer(document,this.schemas[version]));
            }
        }

        return document;
    }
}

function validateSecondary(document, schema) {
    let errors = {};

    Object.keys(schema).map(fieldName => {
        let field = schema[fieldName];
        if (typeof field === 'object' && !field.type) {
            let result = validateSecondary(document[fieldName] || {} ,field);
            if (Object.keys(result).length > 0) {
                errors[fieldName] = result;
            }
        } else {
            let result = validateField(schema[fieldName],document[fieldName], fieldName, document);
            if (result.length > 0) {
                errors[fieldName] = result;
            }
        }
    });

    return errors;
}

function validateField(rules,fieldData, fieldName, document){
    let errors = [];

    if (fieldData && typeof rules === 'object') {
        Object.keys(rules).forEach(key => {
            let rule = rules[key];

            switch (key) {
                case 'type':
                    validateType(fieldName, fieldData, rule, errors);
                    break;
                case 'op':
                    if(typeof rule === 'function') {
                        if (!rule(fieldName, document)) {
                            errors.push(`${fieldName} failed its op check`);
                        }
                    } else {
                        errors.push(`${fieldName}'s schema contains invalid op function`);
                    }
                    break;
                case 'validate':
                    if (!objectValidator(rule, fieldData)) {
                        errors.push(`${fieldName} does not match validation rules defined in schema`);
                    }
                    break;
            }
        });
    } else if (fieldData && typeof rules === 'string') {
        if (typeof fieldData !== rules.toLowerCase()) {
            errors.push(`${fieldName} is type "${(typeof fieldData).toUpperCase()}" expected type "${rules.toUpperCase()}"`);
        }
    } else {
        if (rules.required) {
            if (rules.default) {
                fieldData = rules.default;
            } else {
                if (typeof rules.required === 'object') {
                    let isRequired = true;

                    Object.keys(rules.required).forEach( condition => {
                        if ((typeof rules.required[condition]  === 'function')) {
                            if(!rules.required[condition](condition,document)) {
                                isRequired = false;
                            }
                        } else if (typeof rules.required[condition] === 'string') {
                            if (document[condition] !== rules.required[condition]) {
                                isRequired = false;
                            }
                        } else {
                            isRequired = false;
                        }
                    });

                    if (isRequired) {
                        errors.push(`Required field ${fieldName} is missing.`);
                    }
                } else {
                    errors.push(`Required field ${fieldName} is missing.`);
                }
            }
        }
    }

    return errors;
}

function validateType(fieldName, fieldData, rule, errors) {
    switch (rule) {
        case Types.INTEGER:
            if (typeof fieldData !== 'number' || fieldData % 1 != 0) {
                let error = `${fieldName} is not an INTEGER`
                if(!(errors instanceof Array)) {
                    errors[fieldName] = error;
                } else {
                    errors.push(error);
                }
            }
            break;
        case Types.FLOAT:
            if (typeof fieldData !== 'number' || fieldData % 1 == 0) {
                let error = `${fieldName} is not a FLOAT`
                if(!(errors instanceof Array)) {
                    errors[fieldName] = error;
                } else {
                    errors.push(error);
                }
            }
            break;
        case Types.DATE:
            if (!(fieldData instanceof Date)) {
                let error = `${fieldName} received invalid DATE`
                if(!(errors instanceof Array)) {
                    errors[fieldName] = error;
                } else {
                    errors.push(error);
                }
            }
            break;
        default:
            if(typeof fieldData !== rule.toLowerCase()){
                let error = `${fieldName} is type "${(typeof fieldData).toUpperCase()}" expected type "${rule.toUpperCase()}"`
                if(!(errors instanceof Array)) {
                    errors[fieldName] = error;
                } else {
                    errors.push(error);
                }
            }
    }
}

module.exports = Validator;
