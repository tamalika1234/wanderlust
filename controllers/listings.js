const Listing = require("../models/listing");

const axios = require("axios");

const formatPrice = require("../utils/formatPrice");


module.exports.index = async (req, res) => {
  const { country } = req.query;



  let allListings;

  if (country) {
    allListings = await Listing.find({
      country: { $regex: country, $options: "i" }
    });
  } else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { 
  allListings, 
  formatPrice, 
  country 
  });
  
};


module.exports.renderNewForm = (req, res) => {
     res.render("listings/new.ejs");
};

module.exports.showListing = async (req,res) => {
    let{id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews",
        populate: {
            path:"author"
        },
    })
    .populate("owner");
    
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
   
    // res.render("listings/show.ejs",{listing});

    // Pass formatPrice to EJS
    res.render("listings/show.ejs", { 
        listing, 
        formatPrice, 
        currUser: req.user 
    });
};


//     let url = req.file.path;
//     let filename = req.file.filename;

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image = {url, filename};
//     await newListing.save();
//     req.flash("success","New Listing Created!");
//     res.redirect("/listings");
// };

module.exports.createListing = async (req, res) => {
    const { location, country } = req.body.listing;

    // Combine location + country
    const searchText = `${location}, ${country}`;

    // Forward Geocoding
    const geoResponse = await axios.get(
  "https://nominatim.openstreetmap.org/search",
  {
    params: {
      q: searchText,
      format: "json",
      limit: 1
    },
    headers: {
      "User-Agent": "wanderlust-app/1.0 (tamalika1234@gmail.com)"
    }
  }
);

const data = geoResponse.data;


    // Extract coordinates
    const lat = data[0].lat;
    const lng = data[0].lon;

    // Create listing
    const newListing = new Listing(req.body.listing);

    // image
    newListing.image = {
        url: req.file.path,
        filename: req.file.filename
    };

    // owner
    newListing.owner = req.user._id;

    // geometry (VERY IMPORTANT)
    newListing.geometry = {
        type: "Point",
        coordinates: [lng, lat]
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect(`/listings/${newListing._id}`);
};


module.exports.renderEditForm = async (req,res) => {
    let{id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    const oldLocation = listing.location;
    const oldCountry = listing.country;

    // update text fields
    listing.set(req.body.listing);

    // 🔁 if location OR country changed → re-geocode
    if (
        listing.location !== oldLocation ||
        listing.country !== oldCountry
    ) {
        const searchText = `${listing.location}, ${listing.country}`;

        const geoResponse = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: searchText,
                    format: "json",
                    limit: 1
                },
                headers: {
                    "User-Agent": "wanderlust-app/1.0 (tamalika1234@gmail.com)"
                }
            }
        );

        const data = geoResponse.data;

        if (data.length) {
            listing.geometry = {
                type: "Point",
                coordinates: [data[0].lon, data[0].lat]
            };
        }
    }

    // update image if new image uploaded
    if (typeof req.file !== "undefined") {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyLisiting = async (req,res) => {
    let {id} = req.params;
    let deletedListings = await Listing.findByIdAndDelete(id);
    console.log(deletedListings);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};