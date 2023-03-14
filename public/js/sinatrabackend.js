function SinatraBackend() {
    this.datastore;
    var self = this;

    this.init = function (app) {
        if (typeof (config) == 'undefined') {
            msg = "You need the config. Create a file 'public/js/config.js'.\n"
            msg += "And add the endpoint to the sinatra backend.\n"
            bootbox.alert(msg);
        } else {
            self.config = config;
            if (!$.cookie('email')) {
                app.getEmailPasswort(function (email, password) {
                    self.login(email, password, app.run);
                });
            } else {
                app.run();
            }
        }
    };

    this.sendRequest = function (method, path, success_callback, data, addional_options) {
        var options = {
            method: method,
            url: self.config.endpoint + path,
            crossDomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa($.cookie('email') + ':' + $.cookie('password')));
            },
            success: success_callback
        };
        if (data != undefined) {
            options.data = data;
        }
        if (addional_options != undefined) {
            options = { ...options, ...addional_options };
        }

        $.ajax(options).fail(function (error) {
            if (typeof error_callback === "function") {
                error_callback();
            } else {
                console.log(error);
                bootbox.alert("An error occured: " + error.statusText + ' (' + error.status + '):' + '<br><code>' + error.responseText + '</code>');
            }
        });
    };

    this.login = function (email, password, callback) {
        $.get({
            url: self.config.endpoint + '/recipe',
            crossDomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(email + ':' + password));
            },
            success: function (data, state, xhr) {
                $.cookie('email', email, { expires: 365 });
                $.cookie('password', password, { expires: 365 });
                callback();
            }
        })
            .fail(function (error) {
                bootbox.alert("An error occured: " + error.statusText + ' (' + error.status + '):' + '<br><code>' + error.responseText + '</code>');
            });
    };

    this.exportRecipes = function (callback) {
        self.sendRequest('GET', '/recipe/', callback);
    };

    this.getRecipesTitles = function (callback) {
        var titles = new Array();
        self.sendRequest('GET', '/recipe/', function (data) {
            data.forEach(function (recipe) {
                titles.push(recipe.title);
            });
            callback(titles);
        });
    };

    this.getRecipesByTitle = function (titleStartWith, callback) {
        self.sendRequest('GET', '/recipe/?titleStart=' + titleStartWith, callback);
    };

    this.getRecipesByTag = function (tagId, callback) {
        self.sendRequest('GET', '/tag/' + tagId, callback);
    };

    this.searchRecipeByTitle = function (title, callback, notFoundCallback) {
        self.sendRequest('GET', '/recipe/?title=' + btoa(title), function (recipe) {
            if (recipe) {
                callback(recipe);
            } else {
                notFoundCallback();
            }
        });
    }

    this.getRecipe = function (recipeId, callback) {
        self.sendRequest('GET', '/recipe/' + recipeId, callback);
    };

    this.addRecipe = function (title, description, content, tagList, callback) {
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content,
            'tagList': tagList
        }
        self.sendRequest('POST', '/recipe/', callback, data);
    };

    this.updateRecipe = function (recipeId, title, description, content, tagList, callback) {
        if (title == undefined || title.length == 0) {
            return false;
        }
        var data = {
            'title': title,
            'description': description,
            'content': content,
            'tagList': tagList
        }
        self.sendRequest('PUT', '/recipe/' + recipeId, callback, data);
    };

    this.deleteRecipe = function (recipeId, callback) {
        self.sendRequest('DELETE', '/recipe/' + recipeId, callback);
    }

    this.uploadPicture = function (recipeId, picture, callback) {
        var fd = new FormData();
        fd.append('upload', picture, 'picture');
        options = {
            processData: false,
            contentType: false
        }
        self.sendRequest('POST', '/recipe/' + recipeId + '/picture', callback, fd, options);
    };

    this.deletePicture = function (recipeId, picturePath, callback) {
        self.sendRequest('DELETE', '/recipe/' + recipeId + '/picture/' + btoa(picturePath), callback);
    };

    this.getTagList = function (callback) {
        self.sendRequest('GET', '/tag/?', callback);
    };

    this.addTag = function (name, callback) {
        self.sendRequest('POST', '/tag', callback, { 'name': name });
    };

    this.deleteTag = function (id, callback) {
        self.sendRequest('DELETE', '/tag/' + id, callback);
    }
}