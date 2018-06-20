
const _ = require('lodash');

module.exports = BimModel;

function BimModel(model) {
    this.model = model;
}

BimModel.prototype.add = add;
BimModel.prototype.addArray = addArray;
BimModel.prototype.update = update;
BimModel.prototype.updateMulti = updateMulti;
BimModel.prototype.updateById = updateById;
BimModel.prototype.query = query;
BimModel.prototype.queryById = queryById;
BimModel.prototype.queryOne = queryOne;
BimModel.prototype.removeById = removeById;
BimModel.prototype.removeBy = removeBy;
BimModel.prototype.saveDoc = saveDoc;
BimModel.prototype.applyFilter = applyFilter;
BimModel.prototype.getCount = getCount;
BimModel.prototype.aggregate = aggregate;
BimModel.prototype.aggregateCountByField = aggregateCountByField;
BimModel.prototype.cursor = cursor;

function cursor(query, projection = null, skip = 0) {
    return this.model.find(query, projection).skip(skip).cursor();
}

function add(data) {
    data = _.omit(data, '_id');
    let model = new this.model(data);
    return model.save()
        .then(data => data && data.view());
}

async function addArray(data) {
    if (!_.isArray(data)) {
        data = [data];
    }
    if (!data || !data.length) {
        return [];
    }
    return this.model.insertMany(data)
        .then(results => results && results.map(item => item && item.view()));
}

function update(query, data, upsert) {
    if (upsert === undefined && upsert === null) {
        upsert = false;
    } else {
        upsert = !!upsert;
    }
    return this.model.findOneAndUpdate(query, data, {new: true, upsert})
        .then(result => result && result.view());
}

function updateMulti(query, data, multi, upsert) {
    if (multi === undefined) multi = false;
    if (upsert === undefined) upsert = false;
    return this.model.update(query, data, {multi, upsert})
        .then(data => data);
}

function updateById(_id, data, upsert) {
    return this.model.findByIdAndUpdate(_id, data, {new: true, upsert})
        .then(data => data && data.view());
}

function query(query, projection = null) {
    return this.model.find(query, projection)
        .then(data => data && data.map(item => item && item.view()));
}

function queryById(_id, projection = null) {
    return this.model.findById(_id, projection)
        .then(data => data && data.view());
}

function queryOne(query, projection = null) {
    return this.model.findOne(query, projection)
        .then(data => data && data.view());
}

function removeById(_id) {
    return this.model.findByIdAndRemove(_id)
        .then(data => data && data.view());
}

function removeBy(query) {
    return this.model.remove(query)
        .then(data => data);
}

function getOneDoc(query) {
    return this.model.findOne(query);
}

function getDoc(query) {
    return this.model.find(query);
}

function saveDoc(doc) {
    return doc.save()
        .then(() => doc.view());
}

function applyFilter(filter, byCursor = false) {
    filter.where = filter.where || {};
    if (!filter.order && this.model.orderKey) {
        filter.order = this.model.orderKey();
    }
    let query = this.model.find(filter.where);

    if (!filter.select && this.model.allKeys) {
        filter.select = this.model.allKeys();
    }

    if (filter.select) {
        query.select(filter.select);
    }

    if (filter.order) {
        query.sort(filter.order);
    }
    let skip = filter.skip;
    if (skip) {
        query.skip(skip);
    }
    let limit = filter.limit;
    if (limit && limit > 0) {
        query.limit(limit);
    }
    if (!byCursor) {
        return query.exec()
            .then(results => results && results.map(result => result.view()));
    }
    return query.cursor();
}

function getCount(query = {}) {
    return this.model.find(query).count();
}

function aggregate(aggregations) {
    return this.model.aggregate(aggregations);
}

function aggregateCountByField(projectId, field) {
    let aggregates = [];
    if (projectId) {
        aggregates.push({
            '$match': {projectId}
        });
    }
    let projection = {};
    projection[field] = 1;
    aggregates.push({
        '$project': projection
    });
    aggregates.push({
        '$group': {
            '_id': '$' + field,
            'count': {'$sum': 1}
        }
    });
    return aggregate(this.model, aggregates);
}
