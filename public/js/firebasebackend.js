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
            bootbox.alert(error.message);
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

    this.exportRecipes = function(finishedCallback){
        var recipes = new Array();
        self.getRecipesCollection().get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                recipes.push(doc.data());
            });
            finishedCallback(recipes);
        });
    };

    this.getRecipesTitles = function(finishedCallback){
        var titles = new Array();
        self.getRecipesCollection().get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                var recipe = doc.data();
                titles.push(recipe.title);
            });
            finishedCallback(titles);
        });
    };

    this.getRecipesByTitle = function(titleStartWith, itemCallback, finishedCallback){
        var s = titleStartWith.toUpperCase();
        var e = String.fromCharCode(s.charCodeAt() + 1)

        self.getRecipesCollection().where('title', '>=', s).where('title', '<', e).get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                itemCallback(doc);
            });
            finishedCallback();
        });
    };

    this.searchRecipeByTitle = function(title, itemCallback, notFoundCallback){
        self.getRecipesCollection().where('title', '==', title).get().then(function(querySnapshot){
            querySnapshot.forEach(function(doc){
                itemCallback(doc);
            });
            notFoundCallback();
        });
    }

    this.getRecipe = function(recipeId, itemCallback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            itemCallback(doc);
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

    this.updateRecipe = function(recipeId, title, description, content, itemCallback){
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
            itemCallback(doc);
        });
    };

    this.deleteRecipe = function(recipeId, itemCallback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            if (recipe.pictureList != undefined){
                recipe.pictureList.forEach(function(picturePath){
                    self.getStorageRef().child(picturePath).delete();  
                });
            }
            self.getRecipesCollection().doc(recipeId).delete();
            itemCallback(doc);
        });
    }

    this.uploadPicture = function(recipeId, picture, itemCallback){
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
            itemCallback(picturePath);
        });
    };

    this.addPictureToRecipe = function(recipeId, picturePath, itemCallback){
        self.getRecipesCollection().doc(recipeId).get().then(function(doc){
            var recipe = doc.data();
            if (recipe.pictureList != undefined){
                recipe.pictureList.push(picturePath);
            } else {
                recipe.pictureList = [picturePath];
            }
            self.getRecipesCollection().doc(recipeId).set(recipe);
            itemCallback(doc);
        });
    };

    this.deletePicture = function(recipeId, picturePath, itemCallback){
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
            itemCallback(doc);
        });
    };

    this.getPictureUrl = function(picturePath, itemCallback){
        self.getStorageRef().child(picturePath).getDownloadURL().then(function(url) {
            itemCallback(url);
        });
    };
}