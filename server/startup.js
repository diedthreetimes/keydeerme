var each_image = function(image) {
    // TODO: Sort images by resolution
    //   and include this information along with the query
    // Alternatively, only include maximum resolution images
 
    try {
	//Images.insert({url: image, random: Math.random()});
	
	var resolution = image.match(/-[0-9]*x[0-9]*\.jpg$/);

	if (resolution) {
	    resolution = resolution[0];
	    image = image.replace(resolution, "");
	} else {
	    image = image.replace(/\.jpg$/, "");
	}

	Images.update({url: image},
		      { $setOnInsert: {random: Math.random()},
		        $push: {resolutions: resolution} },
		      { upsert: true});
    } catch (e) {
	// Silence this for now, not sure why it is being repeated
	// Seems to only affect final node in a tree
	//console.log("Insert failed (probably duplicate key)");
    }
}

function scrape() {
    Images.remove({})
    console.log("About to call scrapper");
    new Scraper(Meteor.settings.upload_directory, each_image);
}

Meteor.startup(function() {
    var daily = new Cron(function() {
	scrape();
    }, {
	hour: 14,
	minute: 35
    });

    // This will call way to frequently, uncomment to run immediatly then recomment
    //scrape();
});
