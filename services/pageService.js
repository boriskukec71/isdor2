const defultPageSize = 10;
const defaultSortDirection = -1; // descending

function firstPage(pageInfo) {
    pageInfo.page = 1;
    if (!pageInfo.size) {
        pageInfo.size = defultPageSize;
    }
}

function nextPage(pageInfo) {
    if (!pageInfo.page) {
        pageInfo.page = 1;
    }
    if (!pageInfo.size) {
        pageInfo.size = defultPageSize;
    }
    pageInfo.page++;
    if ((pageInfo.page - 1) * pageInfo.size > pageInfo.totalElements) {
        pageInfo.page--;
    }
}

function prevPage(pageInfo) {
    if (!pageInfo.page) {
        pageInfo.page = 1;
    }
    if (!pageInfo.size) {
        pageInfo.size = defultPageSize;
    }
    pageInfo.page--;
    if (pageInfo.page < 1) {
        pageInfo.page = 1;
    }
}

function lastPage(pageInfo) {
    pageInfo.page = pageInfo.totalPages;
    if (!pageInfo.size) {
        pageInfo.size = defultPageSize;
    }
}

function pageInfo(query) {
    let pageSize = defultPageSize;
    let page = 1;
    if (query.size) {
        pageSize = parseInt(query.size);
    }
    delete query.size;
    if (query.page) {
        page = parseInt(query.page);
    } 
    delete query.page;
    let pageInfo = { size: pageSize, page: page }
    return pageInfo;
}

function skip(pageInfo) {
    return (pageInfo.page - 1) * pageInfo.size;
}

function searchAny(query, inStringProperties) {
    if (query.search) {
        query["$text"] = {"$search": query.search};
        delete query.search;
    }
    if (inStringProperties && inStringProperties.length > 0) {
        for(const inStringProperty of inStringProperties) {
            if (query[inStringProperty]) {
                let regex = new RegExp([query[inStringProperty]].join(""), "i");
                query[inStringProperty]= {"$regex" : regex };
            }
        }
    } 
}

function searchInterval(query, property) {
    if (!query[property]) {
        return;
    }
    query[property] = query[property].filter(item => item !== '');
    if (query[property].length === 2) {
        let values = query[property];
        query[property] = { "$gte": values[0], "$lt": values[1] }; 
        return;
    }
    if (query[property].length === 1) {
        let value1 = new Date(query[property][0]);
        let value2 = new Date(query[property][0]);
        value2.setDate(value2.getDate() + 1);
        query[property] = { "$gte": value1, "$lt": value2}; 
        return;
    }
    delete query[property];
}

function sortBy(query) {
    let sort = {}
    if (!query.sortBy) {
        return sort;
    }
    let sortBy = query.sortBy.split(',');
    let sortDirection = defaultSortDirection;
    if (sortBy.length > 1) {
        sortDirection = parseInt(sortBy[1])
    }    
    delete query.sortBy;
    sort[sortBy[0]] = sortDirection;
    return sort;
}

module.exports = { 
    skip : skip,
    pageInfo : pageInfo,
    firstPage : firstPage,
    lastPage : lastPage,
    nextPage : nextPage,
    prevPage : prevPage,
    searchAny : searchAny,
    sortBy : sortBy,
    searchInterval : searchInterval
}
