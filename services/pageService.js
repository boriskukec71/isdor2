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
    var pageSize = defultPageSize;
    var page = 1;
    if (query.size) {
        pageSize = parseInt(query.size);
    }
    delete query.size;
    if (query.page) {
        page = parseInt(query.page);
    } 
    delete query.page;
    var pageInfo = { size: pageSize, page: page }
    return pageInfo;
}

function skip(pageInfo) {
    return (pageInfo.page - 1) * pageInfo.size;
}

function searchAny(query) {
    if (query.search) {
        query["$text"] = {"$search": query.search};
        delete query.search;
    }
}

function sortBy(query) {
    var sort = {}
    if (!query.sortBy) {
        return sort;
    }
    var sortBy = query.sortBy.split(',');
    var sortDirection = defaultSortDirection;
    if (sortBy.length > 1) {
        sortDirection = parseInt(sortBy[0])
    }    
    sort[sortBy[0]] = sortDirection;
    return sort;
}

exports.skip = skip;
exports.pageInfo = pageInfo;
exports.firstPage = firstPage;
exports.lastPage = lastPage;
exports.nextPage = nextPage;
exports.prevPage = prevPage;
exports.searchAny = searchAny;
exports.sortBy = sortBy;
