var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');
var requireFromString = require('require-from-string');
var objectValidator = require('@fyresite/object-validator');

var Types = require('./types');
var Op = require('./op');
var Transformer = require('./transformer');

var appRoot = path.resolve(__dirname).split('/node_modules')[0];
var schemaPathDefault = path.join(appRoot,'schemas');

/** Class used validate and translate documents */
class Validator {
    /**
     * Create a validator.
     * @param {string} schemaName - Name of the schema to validate.
     * @param {Object} [config] - Custom configuration options.
     * @param {string} config.schemaPath=APP_ROOT/schemas - the path to the schemas folder
     * @param {boolean} config.isS3=true - Define if schema location is a s3 bucket
     * @param {string} config.s3Bucket - Name of the s3 bucket to connect the schemas are located
     * @param {string} config.awsProfile - The AWS Profile you want to use to connect to the bucket
     */
    constructor(schemaName, config) {
        this.finalConf = Object.assign({}, {
            schemaPath:schemaPathDefault,
            isS3: false
        }, config);

        this.schemaName = schemaName;
        this.schemas = {};
        this.translations = {};

        if (this.finalConf.awsProfile) {
          var credentials = new AWS.SharedIniFileCredentials({ profile: this.finalConf.awsProfile });
          AWS.config.credentials = credentials;
        }


        if (!this.finalConf.isS3) {
            fs.readdirSync(path.join(this.finalConf.schemaPath,schemaName, 'schema')).forEach(filename => {
                let filenameSplit = filename.split('.');
                let version = filenameSplit[filenameSplit.length - 2];
                this.schemas[version] = require(path.resolve(path.join(this.finalConf.schemaPath,schemaName, 'schema', filename)))(Types, Op);
            });

            fs.readdirSync(path.join(this.finalConf.schemaPath,schemaName,'translation')).forEach(filename => {
                let filenameSplit = filename.split('.');
                let version = filenameSplit[filenameSplit.length - 2];
                this.translations[version] = require(path.resolve(path.join(this.finalConf.schemaPath,schemaName, 'translation', filename)));
            });
        }
    }
    /**
     * Used to fetch schema from s3, the instance validate function must be used inside .then() to guarantee that schemas are loaded before validating
     * @returns {Promise}
     */
    init() {
        var s3 = new AWS.S3();
        var bucket = this.finalConf.s3Bucket;
        var setSchema = this.setSchema.bind(this);
        var getSchema = this.getSchema.bind(this);
        var setTranslation = this.setTranslation.bind(this);
        var getTranslation = this.getTranslation.bind(this);
        return new Promise((resolve, reject) => {
            var params = {
                Bucket: this.finalConf.s3Bucket, /* required */
                Prefix: path.join(this.finalConf.schemaPath,this.schemaName),
              };
            s3.listObjectsV2(params, function(err, data) {
                if (err) {
                    reject(err)
                } // an error occurred
                else {
                    Promise.all(data.Contents.map(file => {
                        return new Promise((resolve, reject) => {
                            s3.getObject({
                                Bucket: bucket,
                                Key: file.Key
                            }, function (err, item) {
                                if(err) {
                                    reject(err)
                                } else {
                                    let keySplit = file.Key.split('/')
                                    let filenameSplit = keySplit[keySplit.length - 1].split('.')
                                    let version = filenameSplit[filenameSplit.length - 2];
                                    if (keySplit[keySplit.length - 2] === 'schema') {
                                        setSchema(version, requireFromString(item.Body.toString('utf8'))(Types,Op));
                                    }
                                    else if (keySplit[keySplit.length - 2] === 'translation') {
                                        setTranslation(version, requireFromString(item.Body.toString('utf8')));
                                    }
                                    resolve();
                                }
                            })
                        })
                    })).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    })
                }
            });
        });
    }

    setSchema (version, schema) {
        this.schemas[version] = schema;
    }

    getSchema () {
       return this.schemas;
    }

    setTranslation(version, translation) {
        this.translations[version] = translation;
    }
    getTranslation() {
       return this.translations;
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
                let result = validateSecondary(document[fieldName], field);
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
            let result = validateSecondary(document[fieldName],field);
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
                errors.push(`${fieldName} is not an INTEGER`);
            }
            break;
        case Types.FLOAT:
            if (typeof fieldData !== 'number' || fieldData % 1 == 0) {
                errors.push(`${fieldName} is not a FLOAT`);
            }
            break;
        case Types.DATE:
            if (!(fieldData instanceof Date)) {
                errors.push(`${fieldName} received invalid DATE`);
            }
            break;
        default:
            if(typeof fieldData !== rule.toLowerCase()){
                errors.push(`${fieldName} is type "${(typeof fieldData).toUpperCase()}" expected type "${rule.toUpperCase()}"`);
            }
    }
}

module.exports = Validator;