const Listing = require("../models/listing");

const fetch = require("node-fetch");
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
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}`
    );
    const data = await response.json();

    if (!data.length) {
        req.flash("error", "Location not found");
        return res.redirect("/listings/new");
    }

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
    let lisiting = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        lisiting.image = { url, filename };
        await lisiting.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyLisiting = async (req,res) => {
    let {id} = req.params;
    let deletedListings = await Listing.findByIdAndDelete(id);
    console.log(deletedListings);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};