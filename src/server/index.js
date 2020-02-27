const express = require("express");
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const request = require("request");
const app = express();

app.use(express.static("dist"));

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

app.post("/api/getTitleAtURL", (req, res) => {
  if (req.body.url) {
    request(req.body.url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(body);
        const webpageTitle = $("title").text();
        const metaDescription = $("meta[name=description]").attr("content");
        const webpage = {
          title: webpageTitle,
          metaDescription: metaDescription
        };
        res.send(webpage);
      }else{
res.status(400).send({message: "THIS IS AN ERROR"})
}
    });
  }
});

app.listen(process.env.PORT || 8080, () =>
  console.log(`Listening on port ${process.env.PORT || 8080}!`)
);
