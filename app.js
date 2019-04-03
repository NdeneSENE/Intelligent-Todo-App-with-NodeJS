const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todoDB', {useNewUrlParser: true});

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Bienvenue dans votre TodoList"
});

const item2 = new Item({
  name: "Pour ajouter un element appuyer sur +"
});

const item3 = new Item({
  name: "<--Pour supprimer un element appuyer sur ce button"
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listsSchema);

app.get("/", function(req, res) {

  Item.find({}, function(error, foundItems){
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(error){
          if (error) {
            console.log(error);
          } else{
            console.log("succes!!!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);  

  List.findOne({name: customListName}, function(error, foundList){
    if(!error){
      if (!foundList) {
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" +customListName);
      }else{
        //Show an existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(error, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" +listName);
    });
  }

});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;

  const listname = req.body.listName;

  if (listname === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(error){
      if (!error) {
        console.log("Succesfuly deleted");
        res.redirect("/");
      }else{
        console.log(error);
      }
    });
  } else {
    List.findOneAndUpdate({name: listname}, {$pull: {items: {_id: checkedItemId}}}, function(error, foundlist) {
      if (!error) {
        res.redirect("/" +listname);
      }
    });
  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
