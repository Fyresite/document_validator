module.exports = {
    up: function (transformer) {
        transformer.addFields(['added_field', 'name.added_field2']);
        transformer.removeFields(['myFloat', 'address.street2'])
        transformer.renameFields({
            myInt:'myInt2'
        })

        return transformer.finalize();
    }
}