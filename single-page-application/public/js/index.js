'use strict';

// Graceful handling of server disconnection by showing an alert to the user
var io;
var socket = io();
socket.on('disconnect', () => {
    window.alert(`WARNING: The server has disconnected. 
  This application will no longer operate.`);
});

window.addEventListener('load', () => {
    const el = $('#app');

    // Compile Handlebar Templates
    const errorTemplate = Handlebars.compile(
        $('#error-template').html());
    const photoGalleryTemplate = Handlebars.compile(
        $('#photo-gallery-template').html());
    const contributorsTemplate = Handlebars.compile(
        $('#contributors-template').html());
    const registerTemplate = Handlebars.compile(
        $('#register-template').html());
    const loginTemplate = Handlebars.compile(
        $('#login-template').html());
    const uploadTemplate = Handlebars.compile(
        $('#upload-template').html());

    // Router Declaration
    const router = new Router({
        mode: 'history',
        page404: (path) => {
            fetch('/api/checkperms')
                .then(function (response) {
                    return response.text();
                }).then(function (data) {
                    if (JSON.parse(data).message === 'unauthenticated') {
                        const html = errorTemplate({
                            title: 'Error 404 - Page NOT Found!',
                            message: `The path '/${path}' does not exist on this site`,
                            loginOrUploadPhoto: 'Login',
                            registerOrLogout: 'Register',
                            registerOrLogoutHref: '/register',
                            loginOrUploadPhotoHref: '/login'
                        });
                        el.html(html);
                    } else if (JSON.parse(data).message === 'authenticated') {
                        const html = errorTemplate({
                            title: 'Error 404 - Page NOT Found!',
                            message: `The path '/${path}' does not exist on this site`,
                            loginOrUploadPhoto: 'Upload Photo',
                            registerOrLogout: 'Sign out',
                            registerOrLogoutHref: '/api/logout',
                            loginOrUploadPhotoHref: '/upload'
                        });
                        el.html(html);
                    } else {
                        const html = errorTemplate({
                            title: 'Error - something went wrong',
                            message: 'Please try again',
                            loginOrUploadPhoto: 'Login',
                            registerOrLogout: 'Register',
                            registerOrLogoutHref: '/register',
                            loginOrUploadPhotoHref: '/login'
                        });
                        el.html(html);
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    });

    router.add('/register', () => {
        const html = registerTemplate();
        el.html(html);
        document.getElementById('register_form')
            .addEventListener('submit', async function (event) {
                var pass1 = document.forms.register_form.password.value;
                var pass2 = document.forms.register_form.confirm_password.value;
                if (pass1 !== pass2) {
                    document.getElementById('register_alert').style.display = 'block';
                    document.getElementById('register_alert').innerHTML =
                        'Those passwords do not match';
                    event.preventDefault();
                    return false;
                } else {
                    const url = '/api/newaccount';
                    // The data we are going to send in our request
                    const data = {
                        email_address: document.forms.register_form.email_address.value,
                        password: pass1
                    };
                    // The parameters we are gonna pass to the fetch function
                    const fetchData = {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' }
                    };
                    fetch(url, fetchData)
                        .then(function (response) {
                            return response.text();
                        }).then(function (data) {
                            if (JSON.parse(data).message === 'Account successfully registered') {
                                window.location.href = '/';
                            } else {
                                document.getElementById('register_alert').style.display =
                                    'block';
                                document.getElementById('register_alert').innerHTML =
                                    JSON.parse(data).message;
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }
                event.preventDefault();
            });
    });

    router.add('/contributors', () => {
        fetch('/api/checkperms')
            .then(function (response) {
                return response.text();
            }).then(function (data) {
                if (JSON.parse(data).message === 'unauthenticated') {
                    const html = contributorsTemplate({
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login'
                    });
                    el.html(html);
                    organiseLeaderboard();
                } else if (JSON.parse(data).message === 'authenticated') {
                    const html = contributorsTemplate({
                        loginOrUploadPhoto: 'Upload Photo',
                        registerOrLogout: 'Sign out',
                        registerOrLogoutHref: '/api/logout',
                        loginOrUploadPhotoHref: '/upload'
                    });
                    el.html(html);
                    organiseLeaderboard();
                } else {
                    const html = errorTemplate({
                        title: 'Error - something went wrong',
                        message: 'Please try again',
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login'
                    });
                    el.html(html);
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });

    router.add('/', () => {
        fetch('/api/checkperms')
            .then(function (response) {
                return response.text();
            }).then(function (data) {
                if (JSON.parse(data).message === 'unauthenticated') {
                    const html = photoGalleryTemplate({
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login',
                        authOrNot: `Here are some of the stunning photos that 
            have been uploaded to our site. Please login or register 
            so that you can also upload photos!`,
                        allow_comment_submission: 'hidden',
                        show_auth_error: ''
                    });
                    el.html(html);
                    renderImages();
                } else if (JSON.parse(data).message === 'authenticated') {
                    const html = photoGalleryTemplate({
                        loginOrUploadPhoto: 'Upload Photo',
                        registerOrLogout: 'Sign out',
                        registerOrLogoutHref: '/api/logout',
                        loginOrUploadPhotoHref: '/upload',
                        authOrNot: `Welcome. If you have just registered, 
            please go ahead and upload your first photo. 
            If you're a returning user, upload some more!`,
                        allow_comment_submission: '',
                        show_auth_error: 'hidden'
                    });
                    el.html(html);
                    renderImages();
                    // form to submit comments
                    document.getElementById('comment_form')
                        .addEventListener('submit', async function (event) {
                            event.preventDefault();
                            const url = '/api/submitComment';
                            // The data we are going to send in our request
                            const data = {
                                source_link: document.getElementById('to_hold_src_link').value,
                                comment: document.getElementById('validationDefault01').value
                            };
                            // The parameters we are gonna pass to the fetch function
                            const fetchData = {
                                method: 'POST',
                                body: JSON.stringify(data),
                                headers: { 'Content-Type': 'application/json' }
                            };
                            fetch(url, fetchData)
                                .then(function (response) {
                                    window.location.href = '/';
                                    return response.text();
                                })
                                .catch(function (error) {
                                    console.log(error);
                                });
                        });
                } else {
                    const html = errorTemplate({
                        title: 'Error - something went wrong',
                        message: 'Please try again',
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login'
                    });
                    el.html(html);
                }
                // button that allows you to filter photos by user
                document.getElementById('filter_form')
                    .addEventListener('submit', async function (event) {
                        var e = document.getElementById('image_filter');
                        var user = e.options[e.selectedIndex].text;
                        var allPhotos = document.getElementsByClassName('col-md-4');
                        var i;
                        for (i = 0; i < allPhotos.length; i++) {
                            if (user === 'Show all') {
                                if (i !== 0) { // Ignore HTML templated photo
                                    allPhotos[i].style = 'display: block;';
                                }
                            } else if (allPhotos[i].getElementsByTagName('small')[0].innerHTML !==
                                ('Uploaded by: ' + user)) {
                                allPhotos[i].style = 'display: none;';
                            } else {
                                allPhotos[i].style = 'display: block;';
                            }
                        }
                        event.preventDefault();
                    });
            })
            .catch(function (error) {
                console.log(error);
            });
    });

    router.add('/login', () => {
        const html = loginTemplate();
        el.html(html);
        document.getElementById('login_form')
            .addEventListener('submit', async function (event) {
                const url = '/api/auth';
                // The data we are going to send in our request
                const data = {
                    email_address: document.forms.login_form.email_address.value,
                    password: document.forms.login_form.password.value
                };
                // The parameters we are gonna pass to the fetch function
                const fetchData = {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                };
                fetch(url, fetchData)
                    .then(function (response) {
                        return response.text();
                    }).then(function (data) {
                        if (JSON.parse(data).message ===
                            'Successfully logged in') { // login successful
                            window.location.href = '/';
                        } else { // i.e most likely 401 - the server
                            //  responded that the credentials were incorrect
                            document.getElementById('login_alert').style.display = 'block';
                            document.getElementById('login_alert').innerHTML =
                                JSON.parse(data).message;
                        }
                    })
                    .catch(function (error) {
                        document.getElementById('login_alert').style.display = 'block';
                        document.getElementById('login_alert').innerHTML =
                            'An error has occurred. Please try again.';
                        console.log(error);
                    });
                event.preventDefault();
            });
    });

    router.add('/upload', () => {
        fetch('/api/checkperms')
            .then(function (response) {
                return response.text();
            }).then(function (data) {
                if (JSON.parse(data).message === 'unauthenticated') {
                    const html = errorTemplate({
                        title: 'Error 403 - you are unauthenticated.',
                        message: 'You must be logged in to access this page.',
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login'
                    });
                    el.html(html);
                } else if (JSON.parse(data).message === 'authenticated') {
                    const html = uploadTemplate();
                    el.html(html);
                    // form to upload photos
                    document.getElementById('upload_form')
                        .addEventListener('submit', async function (event) {
                            var imageUrl = document.forms.upload_form.source_link.value;
                            imageExists(imageUrl, function (exists) {
                                if (exists === true) {
                                    const url = '/api/uploadPhoto';
                                    // The data we are going to send in our request
                                    const data = {
                                        source_link: document.forms.upload_form.source_link.value,
                                        caption: document.forms.upload_form.caption.value
                                    };
                                    // The parameters we are gonna pass to the fetch function
                                    const fetchData = {
                                        method: 'POST',
                                        body: JSON.stringify(data),
                                        headers: { 'Content-Type': 'application/json' }
                                    };
                                    fetch(url, fetchData)
                                        .then(function (response) {
                                            return response.text();
                                        }).then(function (data) {
                                            if (JSON.parse(data).message ===
                                                'Image successfully uploaded') { // upload successful
                                                window.location.href = '/';
                                            } else {
                                                //  render error message
                                                document.getElementById('upload_alert').style.display =
                                                    'block';
                                                document.getElementById('upload_alert').innerHTML =
                                                    JSON.parse(data).message;
                                            }
                                        })
                                        .catch(function (error) {
                                            console.log(error);
                                        });
                                } else {
                                    // render error message
                                    document.getElementById('upload_alert').style.display = 'block';
                                    document.getElementById('upload_alert').innerHTML =
                                        "That's not a valid image source link";
                                    event.preventDefault();
                                }
                            });
                            event.preventDefault();
                        });
                } else {
                    const html = errorTemplate({
                        title: 'Error - something went wrong',
                        message: 'Please try again',
                        loginOrUploadPhoto: 'Login',
                        registerOrLogout: 'Register',
                        registerOrLogoutHref: '/register',
                        loginOrUploadPhotoHref: '/login'
                    });
                    el.html(html);
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });

    // Navigate app to current url
    router.navigateTo(window.location.pathname);

    // Highlight Active Menu on Refresh/Page Reload
    const link = $(`a[href$='${window.location.pathname}']`);
    link.addClass('active');

    $('a').on('click', (event) => {
        // Block browser page load
        event.preventDefault();

        // Highlight Active Menu on Click
        const target = $(event.target);
        $('.item').removeClass('active');
        target.addClass('active');

        // Navigate to clicked url
        const href = target.attr('href');
        const path = href.substr(href.lastIndexOf('/'));
        router.navigateTo(path);
    });
});

// Calls fetch function to retrieve source links
//  of images and renders them in the gallery
function renderImages () {
    var gallery = document.getElementById('gallery');
    fetch('/api/getImageSources')
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            var results = JSON.parse(data);
            var users = [];
            for (let i = 0; i < results.images.length; i++) {
                const currentSrc = results.images[i].source;
                const currentCaption = results.images[i].caption;
                const currentUser = results.images[i].user;
                // render the images on the page
                var elmnt = document.getElementById('image_template');
                var cln = elmnt.cloneNode(true);
                cln.style = 'display: block;';
                cln.getElementsByTagName('img')[0].src = currentSrc;
                cln.getElementsByTagName('p')[0].innerHTML = currentCaption;
                cln.getElementsByTagName('small')[0].innerHTML =
                    'Uploaded by: ' + currentUser;
                cln.getElementsByTagName('button')[0].id = currentSrc;
                gallery.appendChild(cln);
                // Create array of unique users
                if (!users.includes(results.images[i].user)) {
                    users.push(results.images[i].user);
                }
            }
            // Use array of unique users to populate
            //  the select list for the filter
            var x;
            for (x in users) {
                var selist = document.getElementById('image_filter');
                var option = document.createElement('option');
                option.text = users[x];
                selist.add(option);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

//  Renders the comments for the selected photo
//  ---------------------------------------
//  eslint-disable-next-line no-unused-vars
function renderComments (ele) {
    var id = ele.id; // stored the src link to identify the image
    fetch('/api/getComments?source=' + encodeURIComponent(id))
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            var parent = document.getElementById('to_hold_comments');
            document.getElementById('to_hold_src_link').value = id;
            if (typeof data.results === 'string') { // i.e error message
                parent.innerHTML =
                    data.results;
            } else {
                parent.innerHTML = '';
                var i;
                for (i in data.results) {
                    // render the comments as well as the author of each comment
                    var commentInfo = data.results[i];
                    var paraE = document.createElement('small');
                    var nodeE = document.createTextNode(
                        commentInfo.email_address + ':');
                    paraE.appendChild(nodeE);
                    parent.appendChild(paraE);
                    parent.innerHTML += ' ';
                    var paraC = document.createElement('p');
                    var nodeC = document.createTextNode(commentInfo.comment);
                    paraC.appendChild(nodeC);
                    parent.appendChild(paraC);
                }
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

// Reads JSON file to arrange 'Contributors' table
function organiseLeaderboard () {
    fetch('/api/getUserLeaderboard')
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            var table = document.getElementById('leaderboard');
            var count = data.length + 1;
            var i;
            for (i in data) {
                count--;
                var row = table.insertRow(1);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                cell1.innerHTML = count;
                cell2.innerHTML = data[i][0];
                cell3.innerHTML = data[i][1];
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

// Used to validate image source links
function imageExists (url, callback) {
    var img = new Image();
    // eslint-disable-next-line standard/no-callback-literal
    img.onload = function () { callback(true); };
    // eslint-disable-next-line standard/no-callback-literal
    img.onerror = function () { callback(false); };
    img.src = url;
}
