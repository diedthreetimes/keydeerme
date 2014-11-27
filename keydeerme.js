Images = new Mongo.Collection("images");

if (Meteor.isServer) {
    Images._ensureIndex( {url: 1}, { unique: true });
    Images._ensureIndex( {random: 1} );
}

var PREFER_ORIG = true
function maxResUrl(image) {
    url = image.url

    if (PREFER_ORIG && _.contains(image.resolutions, null)) {
	return url + ".jpg";
    } 

    // May not always be true, but assume default is best
    var max = null;
    var max_res = null;
    _.each(image.resolutions, function(resStr) {
	if (resStr) {
	    res = parseInt(resStr.match(/-[0-9]*/)[0].replace('-', ''));
	    if (!max || max < res) {
		max = res;
		max_res = resStr;
	    }

	    res = parseInt(resStr.match(/x[0-9]*/)[0].replace('-', ''));
	    if (!max || max < res) {
		max = res;
		max_res = resStr;
	    }
	}
    });

    // We may need to check to see how small max_res is
    // and if it is too small use the default if available
    if (!max_res) {
	return url + ".jpg";
    }

    return url + max_res;
}

function randomImageIndexed() {
    var rand = Math.random();
    canidate1 = Images.findOne( {random : { $gte : rand }} );
    canidate2 = Images.findOne( {random : { $lte : rand }} );
    
    if (!canidate1 && !canidate2) {
	return "";
    } else if (!canidate1) {
	return maxResUrl(canidate2);
    } else if (!canidate2) {
	return maxResUrl(canidate1);
    }
    dif1 = Math.abs(canidate1.random - rand);
    dif2 = Math.abs(canidate2.random - rand);
    
    if (dif1 < dif2) {
	Images.update({_id:canidate1._id}, {$set: {random: Math.random()}});
	return maxResUrl(canidate1);
    } else {
	Images.update({_id:canidate2._id}, {$set: {random: Math.random()}});
	return maxResUrl(canidate2);
    }
}

// This is the only way to do it on the client without indexes
// Should compare the two methods
randomImage = function() {
    var skip = Math.floor(Images.find().count()*Math.random());
    return maxResUrl(Images.findOne({}, {skip: skip, limit:1}));
}

Meteor.methods({
    randomImageMethod: function () {
	return randomImageIndexed();
    }
});

if (Meteor.isServer) {
    HTTP.methods({
	'api/random': function(data) {
	    this.setContentType('text/json');
	    this.addHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	    this.addHeader("Pragma", "no-cache"); // HTTP 1.0.
	    this.addHeader("Expires", 0); // Proxies.

	    return '{ "url":"'+ randomImageIndexed() +'"}';
	},

	'api/random.jpg': function(data) {
	    this.setContentType('text/html');
	    this.addHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	    this.addHeader("Pragma", "no-cache"); // HTTP 1.0.
	    this.addHeader("Expires", 0); // Proxies.

	    this.addHeader("Location", randomImageIndexed());
	    this.setStatusCode(303)


	    return "";
	}
    });
}

if (Meteor.isClient) {
  Meteor.startup(function() {
      // Could save one round trip by loading the background in the first round
      //  in a hidden field then moving it to the body background
      Meteor.call("randomImageMethod", function(error,result) {
	  if(error) {
	      return Meteor.settings.default_image; 
	  } else {
	      $('body').css("background-image", "url("+result+")");
	  }
      });
  });

  // counter starts at 0
  Session.setDefault("counter", 0);

  Template.moredeer.helpers({
    counter: function () {
      return Session.get("counter");
    }
  });

  Template.moredeer.events({
    'click button': function () {

	/* this is significantly slower 
	Meteor.call("randomImageMethod", function(error,result) {
	  if(error){
	      $('body').css("background-image", "url( "+randomImage()+")");
	  } else {
	      $('body').css("background-image", "url("+result+")");
	  }
	});
	*/

	$('body').css("background-image", "url( "+randomImage()+")");

	// increment the counter when button is clicked
	Session.set("counter", Session.get("counter") + 1);
    }
  });
}
