function FirebaseBackend(){
    this.datastore;
    var self = this;

    this.init = function(app){
        if (typeof(config) == 'undefined') {
            msg  = "You need the firebase config. Create a file 'public/js/config.js'.\n"
            msg += "Get the config from the firebase app overview (Add firebase to web-app).\n"
            msg += "Paste the config variable to the file."
            bootbox.alert(msg);
        } else {
            firebase.initializeApp(config);
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    console.log("You are logged in as: " + user.email);
                    self.datastore = firebase.firestore();
                    self.storage = firebase.storage();
                    app.run();
                } else {
                    app.getEmailPasswort(function(email, password){
                        self.login(email, password);
                    });
                }
            });
        }
    };

    this.login = function(email, password){
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
            alert(error.message);
        });
    };

    this.getRecipesCollection = function(){
        return self.datastore.collection('recipes');
    };

    this.getTagsCollection = function(){
        return self.datastore.collection('tags');
    };

    this.getStorageRef = function(){
        return self.storage.ref();
    };

    this.getRecipesTitleStart = function(callback){
        var titles = new Array();
        self.getRecipesCollection().get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                var recipe = doc.data();
                titles.push(recipe.title[0]);
            });
            jQuery.unique(titles);
            callback(titles);
        });
    };

    this.getRecipesByTitle = function(titleStartWith, displaySingleRecipe, uncollapseRecipe){
        var s = titleStartWith.toUpperCase();
        var e = String.fromCharCode(s.charCodeAt() + 1)

        self.getRecipesCollection().where('title', '>=', s).where('title', '<', e).get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                displaySingleRecipe(doc);
            });
            uncollapseRecipe();
        });
    };

    this.getRecipe = function(recipeId, callback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            callback(doc);
        });
    };

    this.addRecipe = function(title, description, content){
        if (title == undefined || title.length == 0) {
            return false;
        }
        self.getRecipesCollection().add({
            title: title,
            description: description,
            content: content
        });
    };

    this.updateRecipe = function(recipeId, title, description, content, callback){
        if (title == undefined || title.length == 0) {
            return false;
        }

        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            recipe.title = title;
            recipe.title = title,
            recipe.description = description,
            recipe.content = content
            self.getRecipesCollection().doc(recipeId).set(recipe);
            callback();
        });
    };

    this.deleteRecipe = function(recipeId, callback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            if (recipe.pictureList != undefined){
                recipe.pictureList.forEach(function(picturePath){
                    self.getStorageRef().child(picturePath).delete();  
                });
            }
            self.getRecipesCollection().doc(recipeId).delete();
            callback();
        });
    }

    this.uploadPicture = function(recipeId, picture, callback){
        makeid = function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 5; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        };

        var picturePath = 'images/' + recipeId + '/' + makeid() + '.png';
        var ref = self.getStorageRef().child(picturePath);

        ref.put(picture).then(function(snapshot) {
            console.log('Uploaded a blob or file!');
            callback(picturePath);
        });
    };

    this.addPictureToRecipe = function(recipeId, picturePath, callback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            if (recipe.pictureList != undefined){
                recipe.pictureList.push(picturePath);
            } else {
                recipe.pictureList = [picturePath];
            }
            self.getRecipesCollection().doc(recipeId).set(recipe);
            callback();
        });
    };

    this.deletePicture = function(recipeId, picturePath, callback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            if (recipe.pictureList != undefined){
                recipe.pictureList.forEach(function(p, i){
                    if (picturePath == p) {
                        self.getStorageRef().child(picturePath).delete();
                        recipe.pictureList.splice(i, 1);
                    }
                });
            }
            self.getRecipesCollection().doc(recipeId).set(recipe);
            callback();
        });
    };

    this.getPictureUrl = function(picturePath, callback){
        self.getStorageRef().child(picturePath).getDownloadURL().then(function(url) {
            callback(url);
        });
    };
}