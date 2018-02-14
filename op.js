/** Class used to provide conditions to require flags */
class Op {
    /**
     * Checks if the documents value matches any of the conditions
     * @param {array} conditions Array of conditions to match on the Op functions are valid conditions
     * @returns {function}
     */
    static any(conditions) {
        return function (fieldName, document) {
            let returnValue = false
            conditions.forEach(condition => {
                if ((typeof condition === 'function')) {
                    if (condition()) {
                        returnValue = true
                    }

                } else {
                    if (document[fieldName] === condition) {
                        returnValue = true
                    }
                }
            })
            return returnValue
        }
    }
    /**
     * Accepts Op Function and returns opposite value
     * @param {function} opFunction valid Op function
     * @returns {function}
     */
    static not(opFunction) {
        return function (fieldName, document) {
            return !opFunction(fieldName, document)
        }
    }
    /**
     * Checks if field is set
     * @returns {function}
     */
    static set() {
        return function (fieldName, document) {
            return !!document[fieldName]
        }
    }
    /**
     * Checks if field equals value
     * @param {(number|string|boolean)} value
     * @returns {function}
     */
    static eq(value) {
        return function (fieldName, document) {
            return document[fieldName] === value
        }
    }
    /**
     * Checks if fields value is greater than the provided value
     * @param {number} value
     * @returns {function}
     */
    static gt(value) {
        return function (fieldName, document) {
            if (typeof document[fieldName] === 'number') {
                return document[fieldName] > value
            }
            else {
                return false
            }
        }
    }
    /**
     * Checks if fields value is greater than or equal to provided value
     * @param {number} value
     * @returns {function}
     */
    static gte(value) {
        return function (fieldName, document) {
            if (typeof document[fieldName] === 'number') {
                return document[fieldName] >= value
            }
            else {
                return false
            }
        }
    }
    /**
     * Checks if fields value is less than the provided value
     * @param {number} value
     * @returns {function}
     */
    static lt(value) {
        return function (fieldName, document) {
            if (typeof document[fieldName] === 'number') {
                return document[fieldName] < value
            }
            else {
                return false
            }
        }
    }
    /**
     * Checks if fields value is less than or equal to provided value
     * @param {number} value
     * @returns {function}
     */
    static lte(value) {
        return function (fieldName, document) {
            if (typeof document[fieldName] === 'number') {
                return document[fieldName] <= value
            }
            else {
                return false
            }
        }
    }

}


module.exports = Op