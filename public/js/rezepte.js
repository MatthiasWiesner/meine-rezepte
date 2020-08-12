function MeineRezepte(){
    self = this;

    this.init = function(){
        self.initTemplates();        
        
        var renderer = new marked.Renderer();

        renderer.listitem = function(text) {
            if (/^\s*\[[x ]\]\s*/.test(text)) {
                text = text
                .replace(/^\s*\[ \]\s*/, '<input type="checkbox" class="form-check-input" value=""></input> ')
                .replace(/^\s*\[x\]\s*/, '<input type="checkbox" class="form-check-input" checked="true" value=""></input> ');
                return '<li style="list-style: none">' + text + '</li>';
            } else {
                return '<li>' + text + '</li>';
            }
        };

        marked.setOptions({
            renderer: renderer,
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });

        self.backend = new SinatraBackend();
        self.backend.init(self);
    };

    this.getEmailPasswort = function(callback){
        bootbox.dialog({
            title: 'Email & Passwort',
            message: '<input id="auth-email" class="bootbox-input bootbox-input-email form-control" autocomplete="off" type="email"><br/>' +
                     '<input id="auth-password" class="bootbox-input bootbox-input-password form-control" autocomplete="off" type="password">',
            closeButton: false,
            buttons: {
                cancel: {
                    label: "Cancel",
                    className: 'btn-danger',
                    callback: function(){
                        bootbox.hideAll();
                        return false;
                    }
                },
                ok: {
                    label: "OK",
                    className: 'btn-info',
                    callback: function(){
                        return callback($('#auth-email').val(), $('#auth-password').val());
                    }
                }
            }
        });
    };

    this.run = function(){
        var params = new URLSearchParams(window.location.search);
        if(params.has('recipe')) {
            self.backend.searchRecipeByTitle(params.get('recipe'), function(recipe){
                var recipeId = recipe.id;
                var title = recipe.title;
                self.initiateAlphabet();
                self.initiateTagList();
                self.initNewRecipe();
                $('#recipes-export').on('click', self.onExportRecipes);
                $('#recipes-import').on('click', self.onImportRecipes);
                $('#sign-out').on('click', self.onSignOut);
                self.displayAllRecipesByTitleStart(title[0], recipeId);
            }, function(){
                self.initiateAlphabet();
                self.initiateTagList();
                self.initNewRecipe();
                $('#recipes-export').on('click', self.onExportRecipes);
                $('#recipes-import').on('click', self.onImportRecipes);
                $('#sign-out').on('click', self.onSignOut);
            });
        } else {
            self.initiateAlphabet();
            self.initiateTagList();
            self.initNewRecipe();
            $('#recipes-export').on('click', self.onExportRecipes);
            $('#recipes-import').on('click', self.onImportRecipes);
            $('#sign-out').on('click', self.onSignOut);
        }
        new Clipboard('.recipe-link');
    };

    this.initTemplates = function(){
        self.recipeTemplate = $('#recipe-template').html();
        Mustache.parse(self.recipeTemplate);

        self.recipeNewTemplate = $('#recipe-new-template').html();
        
        self.recipeUpdateTemplate = $('#recipe-update-template').html();
        self.recipeUpdateTaglistTemplate = $('#recipe-update-taglist-template').html();
        Mustache.parse(self.recipeUpdateTemplate);

        self.recipeUpdatePictureRemoveTemplate = $('#recipe-update-picture-remove-template').html();
        Mustache.parse(self.recipeUpdatePictureRemoveTemplate);

        self.tagTemplate = $('#tag-template').html();
    };

    this.initiateAlphabet = function(){
        $('.alphabet-item').addClass('noentries');
        self.backend.getRecipesTitles(function(titles){
            var titleStartList = $.map(titles, function(e){ return e[0]; });
            $.unique(titleStartList);

            titleStartList.forEach(function(titleStart){
                var alphabetItem = $('.alphabet-item:contains("' + titleStart + '")');
                alphabetItem.removeClass('noentries');
                alphabetItem.off("click");
                alphabetItem.on('click', function(){
                    var c = $('span', $(this)).text();
                    self.displayAllRecipesByTitleStart(c);
                });
            });
        });
    };

    this.initiateTagList = function(){
        $('#tagsListContainer').empty();
        self.backend.getTagList(function(tags){
            tags.forEach(function(tag){
                var rendered = $(Mustache.render(self.tagTemplate, {name: tag.name, id: tag.id}));
                rendered.removeClass('active');
                $('#tagsListContainer').append(rendered);
                $('.tag-list-item-link', rendered).on('click', self.displayAllRecipesByTagFilter);
            });
        });
    }

    this.highlightAlphabetItem = function(titleStart){
        $('.alphabet-item').removeClass('alphabet-item-active');
        if (titleStart != undefined){
            $('.alphabet-item:contains("' + titleStart + '")').addClass('alphabet-item-active');
        }
    };

    this.initNewRecipe = function(){
        $('#recipeNewContainer').empty();

        var renderData = {tagList: ""};
        self.backend.getTagList(function(tags){
            tags.forEach(function(tag){
                var data = {
                    tag_id: tag.id,
                    name: tag.name,
                    checked: ""
                }
                renderData["tagList"] += Mustache.render(self.recipeUpdateTaglistTemplate, data);
            });
            var rendered = $(Mustache.render(self.recipeNewTemplate, renderData));
            $('#recipeNewContainer').append(rendered);
            $('#recipe-new-submit').on('click', self.onRecipeNew);
        });
    };

    this.convertToMarkDownList = function(text) {
        var mylist = text.split(/\r?\n/);
        for (var i = 0; i < mylist.length; i++) {
            var element = mylist[i];
            if (element.length == 0) {
                break;
            }
            if (element.indexOf('- ') !== 0){
                mylist[i] = '- ' + element;
            }
        }
        return mylist.join("\n");
    }

    this.onRecipeNew = function(){
        var title = $('#recipe-new-title').val();

        title = self.checkTitle(title);
        if (title == undefined) {
            return false;
        }

        var description = $('#recipe-new-description').val();
        // Zutatenliste soll immer eine MarkDown Liste sein
        description = self.convertToMarkDownList(description);
        var content = $('#recipe-new-content').val();

        var tagList = [];
        $('.form-check-input', $('.recipe-new-tags')).each(function(i, el){
            if (el.checked) {
                tagList.push($(el).attr('data-tag-id'));
            }
        });

        self.backend.addRecipe(title, description, content, tagList, function(recipe){
            $('#recipeNewContainer').empty();
            $('#recipeNewContainer').append($(self.recipeNewTemplate));
    
            self.initNewRecipe();
            self.initiateAlphabet();
            self.displayAllRecipesByTitleStart(title[0], recipe.id);
        });
    };

    this.initNewPicture = function(){
        var fileInput = $('.imageFile');
        fileInput.on('change', function(event) {
            var pictureArea = $(this).closest('.pictureArea');
            self.onPictureNew(event.target.files, pictureArea);
        });
    };

    this.onPictureNew = function(files, pictureArea){
        var recipeId = pictureArea.attr('data-recipe-id');
        var recipeTitle = pictureArea.attr('data-recipe-title');

        var file = event.target.files[0];
        if (file.type.match('image.*')) {
            self.resizeImage(file, pictureArea, function(blob){
                self.backend.uploadPicture(recipeId, blob, function(){
                    self.displayAllRecipesByTitleStart(recipeTitle[0], recipeId);
                });
            });
        } else {
            bootbox.alert("Dieses Bild war wohl keins.");
        }
    };

    this.resizeImage = function(file, pictureArea, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var previewImage = $('#preview_image');
            previewImage.attr('src', e.target.result);
            previewImage.croppie({
                enableExif: true,
                enableZoom: true,
                showZoomer: true,
                enableResize: true,
                enableOrientation: true,
                viewport: {
                    width: 350,
                    height: 350,
                    type: 'rectangle'
                },
                boundary: {
                    width: 380,
                    height: 380
                }
            });
            var rotateButton = $('<button id="pictureRotate" class="fa fa-rotate-right"></button>'); 
            rotateButton.on('click', function(e){
                previewImage.croppie('rotate', 90);
            });
            $('.cr-slider-wrap').append(rotateButton);

            var pictureSubmit = $('<button id="pictureSubmit" class="btn btn-primary">Upload</button>');             
            pictureSubmit.on('click', function(e){
                previewImage.croppie('result', {
                    type: 'blob'
                }).then(function (resp) {
                    callback(resp);
                });
            });
            pictureArea.append(pictureSubmit);

            var destroyButton = $('<button id="pictureDestroy" class="fa fa-trash"></button>'); 
            destroyButton.on('click', function(e){
                $('.imageFile').val('');
                previewImage.attr('src', '');
                previewImage.croppie('destroy');
                rotateButton.remove();
                pictureSubmit.remove();
            });
            $('.cr-slider-wrap').append(destroyButton);
        };
        reader.readAsDataURL(file); 
        reader.onabort = function() {
            bootbox.alert("The upload was aborted.");
        }
        reader.onerror = function() {
            bootbox.alert("An error occured while reading the file.");
        }
    };

    this.displayAllRecipesByTagFilter = function(){
        self.highlightAlphabetItem();

        var tagId = $(this).attr('data-tag-id');

        $(this).parent().siblings().removeClass('active');
        $(this).parent().addClass('active');

        $('#recipesListContainer').empty();
        self.backend.getRecipesByTag(tagId, function(data){
            data.recipes.forEach(function(recipe){
                self.displaySingleRecipe(recipe);
            });
        });
    };

    this.displayAllRecipesByTitleStart = function(titleStart, recipeId){
        $('.tag-list-item', '#tagsListContainer').removeClass('active');
        $('#recipesListContainer').empty();
        self.backend.getRecipesByTitle(titleStart, function(data){
            data.forEach(function(recipe){
                self.displaySingleRecipe(recipe);
            })
            self.highlightAlphabetItem(titleStart);
            if (recipeId != undefined) {
                $('#collapseOne-' + recipeId).collapse('show');
            }
        });
    };

    this.displaySingleRecipe = function(recipe){
        function buildLink(title){
            var link  = window.location.origin;
                link += window.location.pathname + '?';
                link += $.param( {
                    recipe: title
                });
            return link;
        }

        function getAuthor() {
            if (recipe.author != undefined) {
                return recipe.author.email.split('@')[0];
            }
            return '';
        }

        var renderData = {
            id: recipe.id,
            title: recipe.title,
            description: marked(recipe.description),
            content: marked(recipe.content),
            link: buildLink(recipe.title),
            author: getAuthor(),
            tagList: ""
        }

        if (recipe.tags != undefined) {
            recipe.tags.forEach(function(tag){
                var rendered = $(Mustache.render(self.tagTemplate, {name: tag.name, id: tag.id}));
                rendered.addClass('active');
                renderData["tagList"] += rendered[0].outerHTML;
            });
        }
        
        var rendered = $(Mustache.render(self.recipeTemplate, renderData));

        if (recipe.pictureList != undefined) {
            recipe.pictureList.forEach(function(picturePath) {
                var img = $('<img src="" class="img-fluid">');
                $('.pictureList', rendered).append(img);
                img.attr('src', picturePath);
            });
        }

        $('#recipesListContainer').append(rendered);
        $('.recipe-remove', rendered).on('click', self.onRecipeRemove);
        $('.recipe-edit', rendered).on('click', self.onRecipeEdit);
        $('.recipe-clone', rendered).on('click', self.onRecipeClone);
    };

    this.onRecipeRemove = function(){
        var recipeId = $(this).attr('data-recipe-id');
        var title = $(this).attr('data-recipe-title');
        self.backend.deleteRecipe(recipeId, function(){
            self.initiateAlphabet();
            self.displayAllRecipesByTitleStart(title[0]);
        });
    };

    this.onRecipeEdit = function(){
        var recipeId = $(this).attr('data-recipe-id');

        self.backend.getRecipe(recipeId, function(recipe){
            var renderData = {
                id: recipe.id,
                title: recipe.title,
                description: recipe.description,
                content: recipe.content,
                tagList: ""
            }

            function renderUpdateTemlate(){
                var rendered = $(Mustache.render(self.recipeUpdateTemplate, renderData));
    
                if (recipe.pictureList != undefined) {
                    recipe.pictureList.forEach(function(picturePath) {
                        var pic = $(Mustache.render(self.recipeUpdatePictureRemoveTemplate, {
                            id: recipe.id,
                            title: recipe.title,
                            picturePath: picturePath,
                            url: ''
                        }));
                        $('.pictureList', rendered).append(pic);
                        $('.picture-remove', pic).on('click', self.onPictureRemove);
                        $('img', pic).attr('src', picturePath);
                    });
                }
    
                $('#collapseOne-' + recipeId).replaceWith(rendered);
                $('#collapseOne-' + recipeId).collapse('show');
    
                self.initNewPicture();
    
                $('.recipe-update-submit', $('#collapseOne-' + recipeId)).on('click', function(){
                    self.onRecipeUpdate(recipeId);
                });
            }

            self.backend.getTagList(function(tags){
                tags.forEach(function(tag){
                    var data = {
                        tag_id: tag.id,
                        recipe_id: recipeId,
                        name: tag.name,
                        checked: ""
                    }
                    if (tag.recipes.some(el => parseInt(el.id) == parseInt(recipeId))) {
                        data.checked = "checked";
                    }
                    renderData["tagList"] += Mustache.render(self.recipeUpdateTaglistTemplate, data);
                });
                renderUpdateTemlate();
            });
        });
    };

    this.onRecipeUpdate = function(recipeId){
        var title = $('.recipe-update-title', $('#collapseOne-' + recipeId)).val();
        var description = $('.recipe-update-description', $('#collapseOne-' + recipeId)).val();
        // Zutatenliste soll immer eine MarkDown Liste sein
        description = self.convertToMarkDownList(description);
        var content = $('.recipe-update-content', $('#collapseOne-' + recipeId)).val();

        var tagList = [];
        $('.form-check-input', $('#collapseOne-' + recipeId)).each(function(i, el){
            if (el.checked) {
                tagList.push($(el).attr('data-tag-id'));
            }
        });

        title = self.checkTitle(title);
        self.backend.updateRecipe(recipeId, title, description, content, tagList, function(){
            self.displayAllRecipesByTitleStart(title[0], recipeId);
        });
    };

    this.onRecipeClone = function(){
        var recipeId = $(this).attr('data-recipe-id');

        self.backend.getRecipe(recipeId, function(recipe){
            var randomString = function(){
                return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
            };
            title = recipe.title + ' - (copy-id: ' + randomString() + ')';
            self.backend.addRecipe(title, recipe.description, recipe.content, recipe.tags, function(recipe){
                $('#recipeNewContainer').empty();
                $('#recipeNewContainer').append($(self.recipeNewTemplate));
        
                self.initNewRecipe();
                self.initiateAlphabet();
                self.displayAllRecipesByTitleStart(title[0], recipe.id);
            });
        });
    };

    this.onPictureRemove = function(){
        var recipeId = $(this).attr('data-recipe-id');
        var picturePath = $(this).attr('data-picture-path');
        var title = $(this).attr('data-recipe-title');

        self.backend.deletePicture(recipeId, picturePath, function(){
            self.displayAllRecipesByTitleStart(title[0], recipeId);
        });
    };

    this.onExportRecipes = function(){
        self.backend.exportRecipes(function(recipes){
            var json = JSON.stringify(recipes, null, 2);
            var blob = new Blob([json], {type: 'application/json'});
            var url = window.URL.createObjectURL(blob);

            var a = document.createElement("a");
            if (typeof a.download === 'undefined') {
                window.location = url;
            } else {
                a.href = url;
                a.download = 'export_recipes.json';
                document.body.appendChild(a);
                a.click();
            }
            window.URL.revokeObjectURL(url);
        });
    };

    this.onImportRecipes = function(){
        var b = bootbox.dialog({
            title: 'Import Secrets',
            message: $('#tplImportSecrets').html()
        });

        $('#btnSaveImports', b).on('click', $.proxy(function(){
            try {
                var data = JSON.parse($('#content', b).val());
            } catch (err) {q
                alert('The data could not be parsed. Please insert valid json');
                return false;
            }
            data.forEach(function(recipe){
                title = self.checkTitle(recipe.title);
                if (title == undefined) {
                    return false;
                }
                // Zutatenliste soll immer eine MarkDown Liste sein
                description = self.convertToMarkDownList(recipe.description);
                self.backend.addRecipe(title, description, recipe.content, function(){});    
            });
            $('#recipeNewContainer').empty();
            $('#recipeNewContainer').append($(self.recipeNewTemplate));
            self.initiateAlphabet();
        }, this));
    };

    this.onSignOut = function(){
        $.cookie('email', null, {expires: -1});
        $.cookie('password', null, {expires: -1});
        window.location.href = window.location.origin + window.location.pathname;
    }

    this.checkTitle = function(title){
        if (isNaN(title.charAt(0)) == false) {
            bootbox.alert("Der Titel muss mit einem Grossbuchstaben beginnen.");
            return;
        }
        return title.charAt(0).toUpperCase() + title.slice(1);
    };
};

$(document).ready(function(){
    var meineRezepte = new MeineRezepte();
    meineRezepte.init();
});