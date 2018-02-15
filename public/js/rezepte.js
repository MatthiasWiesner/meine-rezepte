function MeineRezepte(){
    self = this;

    this.init = function(){
        self.backend = new FirebaseBackend();
        self.backend.init(self);
        self.initTemplates();

        marked.setOptions({
            renderer: new marked.Renderer(),
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
          });
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
        self.initiateAplphabet();
        self.initNewRecipe();
    };

    this.initTemplates = function(){
        self.recipeTemplate = $('#recipe-template').html();
        Mustache.parse(self.recipeTemplate);

        self.recipeNewTemplate = $('#recipe-new-template').html();

        self.recipeUpdateTemplate = $('#recipe-update-template').html();
        Mustache.parse(self.recipeUpdateTemplate);

        self.recipeUpdatePictureRemoveTemplate = $('#recipe-update-picture-remove-template').html();
        Mustache.parse(self.recipeUpdatePictureRemoveTemplate);
    };

    this.initiateAplphabet = function(titleStart){
        $('.alphabet-item').removeClass('alphabet-item-active');
        if (titleStart != undefined){
            $('.alphabet-item:contains("' + titleStart + '")').addClass('alphabet-item-active');
        }

        $('.alphabet-item').addClass('noentries');
        self.backend.getRecipesTitleStart(function(titles){
            titles.forEach(function(titleStart){
                var alphabetItem = $('.alphabet-item:contains("' + titleStart + '")');
                alphabetItem.removeClass('noentries');
                alphabetItem.off("click");
                alphabetItem.on('click', function(){
                    var c = $('span', $(this)).text();
                    self.displayAllRecipesByTitle(c);
                });
            });
        });
    };

    this.initNewRecipe = function(){
        $('#recipeNewContainer').empty();
        $('#recipeNewContainer').append($(self.recipeNewTemplate));
        $('#recipe-new-submit').on('click', self.onRecipeNew);
    };

    this.onRecipeNew = function(){
        var title = $('#recipe-new-title').val();

        title = self.checkTitle(title);
        if (title == undefined) {
            return false;
        }

        var description = $('#recipe-new-description').val();
        var content = $('#recipe-new-content').val();

        self.backend.addRecipe(title, description, content);

        $('#recipeNewContainer').empty();
        $('#recipeNewContainer').append($(self.recipeNewTemplate));

        self.initNewRecipe();
        self.displayAllRecipesByTitle(title[0]);
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
                self.backend.uploadPicture(recipeId, blob, function(picturePath){
                    self.backend.addPictureToRecipe(recipeId, picturePath, function(){
                        self.displayAllRecipesByTitle(recipeTitle[0], recipeId);
                    });
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
            alert("The upload was aborted.");
        }
        reader.onerror = function() {
            alert("An error occured while reading the file.");
        }
    };

    this.displayAllRecipesByTitle = function(titleStart, recipeId){
        $('#recipesListContainer').empty();
        if (recipeId != undefined) {
            self.backend.getRecipesByTitle(titleStart, self.displaySingleRecipe, function(){
                $('#collapseOne-' + recipeId).collapse('show');
            });
        } else {
            self.backend.getRecipesByTitle(titleStart, self.displaySingleRecipe, function(){});
        }
        self.initiateAplphabet(titleStart);
    };

    this.displaySingleRecipe = function(doc){
        var recipe = doc.data();
        var rendered = $(Mustache.render(self.recipeTemplate, {
            id: doc.id,
            title: recipe.title,
            description: marked(recipe.description),
            content: marked(recipe.content)
        }));
        
        if (recipe.pictureList != undefined) {
            recipe.pictureList.forEach(function(picturePath) {
                var img = $('<img src="" class="img-fluid">');
                $('.pictureList', rendered).append(img);
                self.backend.getPictureUrl(picturePath, function(url){
                    img.attr('src', url);
                });
            });
        }

        $('#recipesListContainer').append(rendered);
        $('.recipe-remove', rendered).on('click', self.onRecipeRemove);
        $('.recipe-edit', rendered).on('click', self.onRecipeEdit);
    };

    this.onRecipeRemove = function(){
        var recipeId = $(this).attr('data-recipe-id');
        var title = $(this).attr('data-recipe-title');
        self.backend.deleteRecipe(recipeId, function(){
            self.displayAllRecipesByTitle(title[0]);
        });
    };

    this.onRecipeEdit = function(){
        var recipeId = $(this).attr('data-recipe-id');

        self.backend.getRecipe(recipeId, function(doc){
            var recipe = doc.data();
            var rendered = $(Mustache.render(self.recipeUpdateTemplate, {
                id: doc.id,
                title: recipe.title,
                description: recipe.description,
                content: recipe.content
            }));

            if (recipe.pictureList != undefined) {
                recipe.pictureList.forEach(function(picturePath) {
                    var pic = $(Mustache.render(self.recipeUpdatePictureRemoveTemplate, {
                        id: doc.id,
                        title: recipe.title,
                        picturePath: picturePath,
                        url: ''
                    }));
                    $('.pictureList', rendered).append(pic);
                    $('.picture-remove', pic).on('click', self.onPictureRemove);

                    self.backend.getPictureUrl(picturePath, function(url){
                        $('img', pic).attr('src', url);
                    });
                });
            }

            $('#collapseOne-' + recipeId).replaceWith(rendered);
            $('#collapseOne-' + recipeId).collapse('show');

            self.initNewPicture();

            $('.recipe-update-submit', $('#collapseOne-' + recipeId)).on('click', function(){
                self.onRecipeUpdate(recipeId);
            });
        });
    };

    this.onRecipeUpdate = function(recipeId){
        var title = $('.recipe-update-title', $('#collapseOne-' + recipeId)).val();
        var description = $('.recipe-update-description', $('#collapseOne-' + recipeId)).val();
        var content = $('.recipe-update-content', $('#collapseOne-' + recipeId)).val();

        title = self.checkTitle(title);
        self.backend.updateRecipe(recipeId, title, description, content, function(){
            self.displayAllRecipesByTitle(title[0], recipeId);
        });
    };

    this.onPictureRemove = function(){
        var recipeId = $(this).attr('data-recipe-id');
        var picturePath = $(this).attr('data-picture-path');
        var title = $(this).attr('data-recipe-title');

        self.backend.deletePicture(recipeId, picturePath, function(){
            self.displayAllRecipesByTitle(title[0], recipeId);
        });
    };

    this.checkTitle = function(title){
        if (isNaN(title.charAt(0)) == false) {
            alert("Der Titel muss mit einem Grossbuchstaben beginnen.");
            return;
        }
        return title.charAt(0).toUpperCase() + title.slice(1);
    };
};

$(document).ready(function(){
    var meineRezepte = new MeineRezepte();
    meineRezepte.init();
});