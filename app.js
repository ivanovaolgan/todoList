const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const date = require(__dirname + "/date.js");

const app = express();
const linkToLocalServer = "mongodb://localhost:27017/todoDB";
const link = "mongodb+srv://admin-olga:@cluster0.og3yg.mongodb.net/todoDB";
mongoose.connect(link, {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/",(req,res)=>{
  let day = date.getDate();
  Item.find({}, (err, foundItems)=>{
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (err)=>{
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully added new default items to mongodb collection!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, (err, result)=>{
    if (err){
      console.log(err);
    } else {
      if (!result) {
        console.log("The list doesn't exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else {
        console.log("The list exists");
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
    }
  });


});

app.post("/", (req,res)=>{
 const itemName = req.body.newItem;
 const listName = req.body.list;

 const itemNew = new Item({
   name: itemName
 });
 if(listName ==="Today"){
    itemNew.save();
    res.redirect("/");
} else {
    List.findOne({name: listName},(err, result) => {
      if(!err){
        result.items.push(itemNew);
        result.save();
      }
    });
    res.redirect("/"+listName);
  }
});

app.post("/delete", (req,res)=>{
  const itemDelete = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today") {
    Item.findByIdAndRemove(itemDelete,(err)=>{
      if(err){
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: itemDelete}}},
      (err, result) =>{
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }

});




app.get("/about", (req,res)=>{
    res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
