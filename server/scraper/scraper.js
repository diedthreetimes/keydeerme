
function process(url, fn) {
    // TODO: Do we need to thread this?
    //   If clients eventually are going to call this we may need to
    //   look at http://docs.meteor.com/#/full/http_call specifically this.unblock()
    if (!url) {
	throw new Error("Need a url to parse");
    }

    console.log("Fetching " + url);
    
    try {
	var result = HTTP.get(url);
	refs = parse(result.content, url);
	
	_.each(refs[0], function(link) {
	    process(link, fn);
	});
	
	_.each(refs[1], function(image) {
	    fn(image);
	});
	return true;
    } catch (e) {
	console.log("Network error: " + e.stack);
	return false;
    }
}

var Cheerio = Meteor.npmRequire('cheerio');

// Take a loaded page and a set of filters
// return with an array of links (href) matching each filter
// The default filters look for links without an extention, and images
// Anything matching parentFilter is skipped
function parse(result, url, parentFilter, filters) {
    filters = filters || [new RegExp(/^[^\.]*$/), new RegExp(/\.jpg$/) ];
    parentFilter = parentFilter || new RegExp(/Parent Directory/);
    // Note the default filter won't return directories with '.' in the name
    // Could probably look for '/' to get around this

    $ = Cheerio.load(result);
    var links = $('a');

    result = [];
    for (i = 0; i < filters.length; i++) {
	result[i] = [];
    }

    _.each(links, function(link) {
	var href = $(link).attr('href');
	
	if (href && !parentFilter.test($(link).text())) {
	    // If not an absolute path
	    if (!/http[s]?:\/\//i.test(href)) {
		// if no starting slash prepend the url
		href = url + href

		// If we have a starting slash prepend the hostname
		// TODO: 
            }
	    for (i=0; i<result.length; i++) {
		// Does the original href match? 
		// May want to change this later for more consistency
		if (filters[i].test($(link).attr('href'))) {
		    result[i][result[i].length] = href;
		}
	    }
	}
    });

    return result;
}


Scraper = function(url, fn) {
    process(url, fn)
};
