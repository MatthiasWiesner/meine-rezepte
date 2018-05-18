function SinatraBackend(){
    this.datastore;
    var self = this;

    this.init = function(app){
        if (typeof(config) == 'undefined') {
            msg  = "You need the firebase config. Create a file 'public/js/config.js'.\n"
            msg += "Get the config from the firebase app overview (Add firebase to web-app).\n"
            msg += "Paste the config variable to the file."
            bootbox.alert(msg);
        } else {
            self.config = config;
            if (!$.session.get('email')){
                app.getEmailPasswort(function(email, password){
                    self.login(email, password, app.run);
                });
            } else {
                app.run();
            }
        }
    };

    this.sendRequest = function(method, path, success_callback, data, addional_options){
        var options = {
            method: method,
            url: self.config.endpoint + path,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa($.session.get('email') + ':' + $.session.get('password')));
            },
            success: success_callback
        };
        if (data != undefined){
            options.data = data;
        }
        if (addional_options != undefined){
            options = {...options, ...addional_options};
        }

        $.ajax(options).fail(function(error, a, b) {
            if (typeof error_callback === "function") {
                error_callback();
            } else {
                console.log(error);
                console.log(a);
                console.log(b);
                bootbox.alert("An error occured: " + error.status + ' ' + error.statusText);
            }
        });
    };

    this.login = function(email, password, callback){
        $.get({
            url: self.config.endpoint + '/recipe',
            crossDomain: true,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(email + ':' + password));
            },
            success: function(data, state, xhr){
                $.session.set('email', email);
                $.session.set('password', password);
                callback();
            }
        })
        .fail(function(error) {
            bootbox.alert("An error occured: " + error.status + ' ' + error.statusText);
        });
    };

    this.getRecipesTitles = function(finishedCallback){
        var titles = new Array();
        self.sendRequest('GET', '/recipe/', function(data){
            data.forEach(function(recipe){
                titles.push(recipe.title);
            });
            finishedCallback(titles);
        });
    };

    this.getRecipesByTitle = function(titleStartWith, itemCallback, finishedCallback){
        self.sendRequest('GET', '/recipe/?titleStart=' + titleStartWith, function(data){
            data.forEach(function(recipe){
                itemCallback(recipe);
            });
            finishedCallback();
        });
    };

    this.searchRecipeByTitle = function(title, itemCallback, notFoundCallback){
        self.sendRequest('GET', '/recipe/?title=' + btoa(title), function(recipe){
            if (recipe) {
                itemCallback(recipe);
            } else {
                notFoundCallback();
            }
        });
    }

    this.getRecipe = function(recipeId, itemCallback){
        self.sendRequest('GET', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        });
    };

    this.addRecipe = function(title, description, content, itemCallback){
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content
        }
        self.sendRequest('POST', '/recipe/', function(recipe){
            itemCallback(recipe);
        }, data);
    };

    this.updateRecipe = function(recipeId, title, description, content, itemCallback){
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content
        }
        self.sendRequest('PUT', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        }, data);
    };

    this.deleteRecipe = function(recipeId, itemCallback){
        self.sendRequest('DELETE', '/recipe/' + recipeId, function(recipe){
            itemCallback(recipe);
        });
    }

    this.uploadPicture = function(recipeId, picture, itemCallback){
        var fd = new FormData();
        fd.append('upload', picture, 'picture');
        options = {
            processData: false,
            contentType: false
        }

        self.sendRequest('POST', '/recipe/' + recipeId + '/picture', function(recipe){
            itemCallback(recipe);
        }, fd, options);
    };

    this.deletePicture = function(recipeId, picturePath, itemCallback){
        self.sendRequest('DELETE', '/recipe/' + recipeId + '/picture/' + btoa(picturePath), function(recipe){
            itemCallback(recipe);
        });
    };
}