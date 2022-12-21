import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import _ from "lodash";

//define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//setting up the app/ server/ js controler file
const app = express();

//Set up body parser
app.use(bodyParser.urlencoded({ extended: true }));

//Set up the public forlder for static files
app.use(express.static("public"));

//setting up the view engine
app.set("view engine", "ejs");

//Connnect to mongodb server
main().catch((err) => console.log(err));

async function main() {
  // const url = "mongodb://127.0.0.1:27017"; //url for local hosting
  const url =
    "mongodb+srv://admin-tharindu:Test123@cluster0.xennlzp.mongodb.net"; //url for mongoDB Atlas server
  const dbPath = "/todoListDB"; //Connects to todoListDB if available. Creates todoListDB if unavailable
  mongoose.set("strictQuery", true);
  await mongoose.connect(url + dbPath, {
    //Opens the data base using .connect method
    useNewUrlParser: true,
  });
}

//Create todo items Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

//Create mongoose model including collection name
const Item = new mongoose.model("Item", itemsSchema);

//Create todo items
const item1 = new Item({
  name: "Welcome to the todo list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// Item.deleteMany({ name: "Hit the + button to add a new item" }, function (err) {
//   err ? console.log(err) : console.log("Successfully deleted items");
// });

app.get("/", function (req, res) {
  //Finds all feilds available in Item collection
  Item.find(function (err, items) {
    //.find returns an array
    if (items.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        err ? console.log(err) : console.log("Successfully saved all items");
      });
      res.redirect("/"); //This time directed to root route with three items.
    } else {
      res.render("list", { listTitle: "Main Items", newListItem: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save(function (err, result) {
      res.redirect("/");
    });
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      //checks whether a list entry by the name of listName is already available in the List collection
      foundList.items.push(newItem);
      foundList.save(function (err, result) {
        res.redirect(`/${listName}`);
      });
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      err ? console.log(err) : console.log("Successfully deleted checked item");
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) res.redirect(`/${listName}`);
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save(function (err, result) {
        res.redirect(`/${customListName}`);
      });
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItem: foundList.items,
      });
    }
  });

  // List.deleteMany({}, function (err) {
  //   err ? console.log(err) : console.log("Successfully deleted all items");
  // });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
