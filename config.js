// Configuration options
const init_phones = ["Antdroid v6 Target"],            // Optional. Which graphs to display on initial load. Note: Share URLs will override this set
      DIR = "data/",                                // Directory where graph files are stored
      default_channels = ["L","R"],                 // Which channels to display. Avoid javascript errors if loading just one channel per phone
      default_normalization = "dB",                 // Sets default graph normalization mode. Accepts "dB" or "Hz"
      default_norm_db = 60,                         // Sets default dB normalization point
      default_norm_hz = 500,                        // Sets default Hz normalization point (500Hz is recommended by IEC)
      max_channel_imbalance = 5,                    // Channel imbalance threshold to show ! in the channel selector
      alt_layout = true,                           // Toggle between classic and alt layouts
      alt_sticky_graph = true,                      // If active graphs overflows the viewport, does the graph scroll with the page or stick to the viewport?
      alt_animated = true,                         // Determines if new graphs are drawn with a 1-second animation, or appear instantly
      alt_header = true,                           // Display a configurable header at the top of the alt layout
      alt_header_new_tab = true,                    // Clicking alt_header links opens in new tab
      alt_tutorial = true,                         // Display a configurable frequency response guide below the graph
      alt_augment = false,                          // Display augment card in phone list, e.g. review sore, shop link
      site_url = 'index.html',                      // URL of your graph "homepage"
      share_url = true,                             // If true, enables shareable URLs
      watermark_text = "AudioDiscourse.com | IEC-60138-4",                 // Optional. Watermark appears behind graphs
      watermark_image_url = "logo.png",   // Optional. If image file is in same directory as config, can be just the filename
      page_title = "Audio Discourse Graph Tool",                     // Optional. Appended to the page title if share URLs are enabled
      page_description = "View and compare frequency response graphs for earphones",
      accessories = false,                          // If true, displays specified HTML at the bottom of the page. Configure further below
      externalLinksBar = false,                      // If true, displays row of pill-shaped links at the bottom of the page. Configure further below
      restricted = false,                           // Enables restricted mode. More restricted options below
      expandable = false,                           // Enables button to expand iframe over the top of the parent page
      expandableOnly = false,                       // Prevents iframe interactions unless the user has expanded it. Accepts "true" or "false" OR a pixel value; if pixel value, that is used as the maximum width at which expandableOnly is used
      headerHeight = '0px',                         // Optional. If expandable=true, determines how much space to leave for the parent page header
      darkModeButton = true,                        // Adds a "Dark Mode" button the main toolbar to let users set preference
      targetDashed = true,                         // If true, makes target curves dashed lines
      targetColorCustom = false,                    // If false, targets appear as a random gray value. Can replace with a fixed color value to make all targets the specified color, e.g. "black"
      labelsPosition = "bottom-left",                   // Up to four labels will be grouped in a specified corner. Accepts "top-left," bottom-left," "bottom-right," and "default"
      stickyLabels = true,                          // "Sticky" labels
      analyticsEnabled = true,                     // Enables Google Analytics 4 measurement of site usage
      extraEnabled = true,                          // Enable extra features
      extraUploadEnabled = true,                    // Enable upload function
      extraEQEnabled = true,                        // Enable parametic eq function
      extraEQBands = 5,                            // Default EQ bands available
      extraEQBandsMax = 20,                         // Max EQ bands available
      extraToneGeneratorEnabled = true;             // Enable tone generator function

// Specify which targets to display
const targets = [
 { type:"Antdroid", files:["Antdroid v6",  "Antdroid v6 Lite", "Antdroid v6 Bass"] },
  { type:"Industry"   , files:["Harman","Listen Inc", "JM-1 (Tilt-1dB Oct)", "ISO 11904-1 DF (Tilt-1dB Oct)"] },
 { type:"Reviewer", files:["Acho", "HBB", "Crinacle", "In-Ear Fidelity","Precog","Super 22","Toranku","USOUND1V1 Oratory1990"] }
];



// *************************************************************
// Functions to support config options set above; probably don't need to change these
// *************************************************************

// Set up the watermark, based on config options above
function watermark(svg) {
  let wm = svg.append("g")
  .attr("transform", "translate("+(pad.l+W/2)+","+(pad.t+H/2-20)+")")
  .attr("opacity",0.2);

  if ( watermark_image_url ) {
    wm.append("image")
    .attrs({x:-125, y:0, width:250, height:250,  "xlink:href":watermark_image_url});
  }

  if ( watermark_text ) {
    wm.append("text")
    .attrs({x:240, y:170, "font-size":16, "font-family":"tahoma", "text-anchor":"middle", "class":"graph-name"})
    .text(watermark_text);
  }
}



// Parse fr text data from REW or AudioTool format with whatever separator
function tsvParse(fr) {
    return fr.split(/[\r\n]/)
        .map(l => l.trim()).filter(l => l && l[0] !== '*')
        .map(l => l.split(/[\s,]+/).map(e => parseFloat(e)).slice(0, 2))
        .filter(t => !isNaN(t[0]) && !isNaN(t[1]));
}

// Apply stylesheet based layout options above
function setLayout() {
    function applyStylesheet(styleSheet) {
        var docHead = document.querySelector("head"),
            linkTag = document.createElement("link");

        linkTag.setAttribute("rel", "stylesheet");
        linkTag.setAttribute("type", "text/css");

        linkTag.setAttribute("href", styleSheet);
        docHead.append(linkTag);
    }

    if ( !alt_layout ) {
        applyStylesheet("style.css");
    } else {
        applyStylesheet("style-alt.css");
        applyStylesheet("style-alt-theme.css");
    }
}
setLayout();



// Set restricted mode
function setRestricted() {
    if ( restricted ) {
        max_compare = 2;
        restrict_target = false;
        disallow_target = true;
        premium_html = "<h2>You gonna pay for that?</h2><p>To use target curves, or more than two graphs, <a target='_blank' href='https://crinacle.com/wp-login.php?action=register'>subscribe</a> or upgrade to Patreon <a target='_blank' href='https://www.patreon.com/join/crinacle/checkout?rid=3775534'>Silver tier</a> and switch to <a target='_blank' href='https://crinacle.com/graphs/iems/graphtool/premium/'>the premium tool</a>.</p>";
    }
}
setRestricted();



// Configure HTML accessories to appear at the bottom of the page. Displayed only if accessories (above) is true
// There are a few templates here for ease of use / examples, but these variables accept any HTML
const
    // Short text, center-aligned, useful for a little side info, credits, links to measurement setup, etc.
    simpleAbout = `
        <p class="center">This web software is based on the <a href="https://github.com/mlochbaum/CrinGraph">CrinGraph</a> open source software project.</p>
    `,
    // Slightly different presentation to make more readable paragraphs. Useful for elaborated methodology, etc.
    paragraphs = `
        <h2>Viverra tellus in hac</h2>

        <p>Lorem ipsum dolor sit amet, <a href="">consectetur adipiscing elit</a>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quisque non tellus orci ac. Dictumst quisque sagittis purus sit amet volutpat consequat. Vitae nunc sed velit dignissim sodales ut. Faucibus ornare suspendisse sed nisi lacus sed viverra tellus in. Dignissim enim sit amet venenatis urna cursus eget nunc. Mi proin sed libero enim. Ut sem viverra aliquet eget sit amet. Integer enim neque volutpat ac tincidunt vitae. Tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada. Mauris rhoncus aenean vel elit scelerisque mauris pellentesque. Lacus luctus accumsan tortor posuere ac ut consequat semper. Non pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus. Aliquam sem et tortor consequat id. Cursus sit amet dictum sit amet justo donec. Donec adipiscing tristique risus nec feugiat in fermentum posuere.</p>

    `,
    // Customize the count of widget divs, and customize the contents of them. As long as they're wrapped in the widget div, they should auto-wrap and maintain margins between themselves
    widgets = `
        <div class="accessories-widgets">
            <div class="widget">
                <img width="200" src="logo.png"/>
            </div>

            <div class="widget">
                <img width="200" src="logo.png"/>
            </div>

            <div class="widget">
                <img width="200" src="logo.png"/>
            </div>
        </div>
    `,
    // Which of the above variables to actually insert into the page
    whichAccessoriesToUse = simpleAbout;



// Configure external links to appear at the bottom of the page. Displayed only if externalLinksBar (above) is true
const linkSets = [
    {
	label: "Audio Discourse",
        links: [
            {
                name: "Reviews",
                url: "https://www.audiodiscourse.com/"
            },
            {
                name: "IEM Rankings",
                url: "https://www.audiodiscourse.com/p/antdroid-iem-ranking-list.html"
            },
            {
                name: "Headphones Graph DB",
                url: "https://headphones.audiodiscourse.com/"
            }
        ]
	},
	{
        label: "IEM graph databases",
        links: [

            {
                name: "Bad Guy",
                url: "https://hbb.squig.link/"
            },
            {
                name: "HypetheSonics",
                url: "https://www.hypethesonics.com/iemdbc/"
            },
            {
                name: "In-Ear Fidelity",
                url: "https://crinacle.com/graphs/iems/graphtool/"
            },
            {
                name: "Precogvision",
                url: "https://precog.squig.link/"
            },
            {
                name: "Super* Review",
                url: "https://squig.link/"
            },
        ]
    },
    {
        label: "Headphones",
        links: [
            {
                name: "In-Ear Fidelity",
                url: "https://crinacle.com/graphs/headphones/graphtool/"
            },
            {
                name: "Super* Review",
                url: "https://squig.link/hp.html"
            }
        ]
    }
];



// Set up analytics
function setupGraphAnalytics() {
    if ( analyticsEnabled ) {
        const pageHead = document.querySelector("head"),
              graphAnalytics = document.createElement("script"),
              graphAnalyticsSrc = "graphAnalytics.js";

        graphAnalytics.setAttribute("src", graphAnalyticsSrc);
        pageHead.append(graphAnalytics);
    }
}
setupGraphAnalytics();



// If alt_header is enabled, these are the items added to the header
let headerLogoText = "Audio Discourse",
    headerLogoImgUrl = "ad-core-logo_cob.png",
    headerLinks = [
    {
        name: "| Audio Discourse Reviews |",
        url: "https://www.audiodiscourse.com"
    },
    {
        name: "| IEM Ranking List |",
        url: "https://rankings.audiodiscourse.com"
    },
    {
        name: "| IEM Graph Tool |",
        url: "https://iems.audiodiscourse.com"
    },
    {
        name: "| Headphones Ranking List |",
        url: "https://www.audiodiscourse.com/p/antdroids-headphones-ranking-list.html"
    },
    {
        name: "| Headphones Graph Tool |",
        url: "https://headphones.audiodiscourse.com"
    }
];


let tutorialDefinitions = [
    {
        name: 'Sub-Bass',
        width: '20.1%',
        description: 'Rumble'
    },
    {
        name: 'Bass',
        width: '19.2%',
        description: 'Punch'
    },
    {
        name: 'Mid-Range',
        width: '17.4%',
        description: 'Body'
    },
    {
        name: 'Upper-Mids',
        width: "20%",
        description: 'Upper-Mids'
    },
    {
        name: 'Lower-Treble',
        width: '6%',
        description: 'Presence'
    },
    {
        name: 'Treble',
        width: '7.3%',
        description: 'Sibilance'
    },
    {
        name: 'Upper-Treble',
        width: '10%',
        description: 'Treble Extension'
    }
]
