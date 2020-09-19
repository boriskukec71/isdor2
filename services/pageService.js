const defultPageSize = 10;

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

exports.skip = skip;
exports.pageInfo = pageInfo;
exports.firstPage = firstPage;
exports.lastPage = lastPage;
exports.nextPage = nextPage;
exports.prevPage = prevPage;
exports.searchAny = searchAny;
