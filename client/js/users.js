const storage = new ListStorage();
const usersContainer = $('#users');

$(() => {
    initModalListeners();

    fetch(`/users/data`)
    .then(resp => resp.json())
    .then(users => {
        if (users.length) {
            usersContainer.html('');
            users.forEach(user => {
                storage.add(user.id, user);
                usersContainer.append(addUser(user));
            });
        } else {
            usersContainer.html('No users exist.');
        }
    })
    .catch(err => {
        console.error(err);
    });
});

function addUser(user) {
    return $(`<div class="card" style="width: 10rem; float: left; margin:10px" id="user-info-${user.id}">
            <img class="card-img-top rounded" id="ac-user-ava-${user.id}" src="${user.avatar}" alt="Ava for ${user.name}">
            <div class="card-body">
                <h5>${user.name}</h5>
                <a class="btn btn-primary manager-controls" href="#" id="ac-edit-user-${user.id}"  data-toggle="modal" data-target="#newUser" data-action="${user.id}">Edit</a>
                <!-- a href="#" data-id="${user.id}" onclick="remove(this)">Remove</a -->
            </div>
        </div>`);
}

function remove(target) {
    const id = $(target).attr('data-id');
    const name = storage.get(id, 'name');

    if (confirm(`Do you want to remove user "${name}"?`)) {
        storage.set(id, 'deleted', 1);
        $.post(
            '/users/update',
            storage.getData(id),
            (res) => {
                if (res.message) {
                    console.error(res);
                } else {
                    storage.del(id);
                    $(`#user-info-${id}`).remove();
                }
            }
        );
    }
}

function initModalListeners() {
    $('#newUser').on('show.bs.modal', function (event) {
        const target = $(event.relatedTarget) // Button that triggered the modal
        const action = target.attr('data-action');
        const name = storage.get(action, 'name');
        const ava = storage.get(action, 'avatar');
        const modal = $(this);
        modal.attr('data-action', action);
        $('#user_name').val(name ? name : '');
        $('#ava_url').val(ava ? ava : '');
    })
}



function createUser() {
    /*
        Parsing modal window data-attributes.
    */
    const modal = $('#newUser');
    const action = modal.attr('data-action');
    const newUserName = $('#user_name').val();
    const newUserAva = $('#ava_url').val();

    if (newUserName) {
        if (action == 'new') {
            $.post(
                '/users/add',
                {
                    name: newUserName,
                    action: action,
                    avatar: newUserAva
                },
                (res) => {
                    if (res.message) {
                        console.error(res);
                    } else {
                        usersContainer.prepend(addUser(res));
                    }
                    $('#newUser').modal('hide');
                }
            );
        } else {
            storage.set(action, 'name', newUserName);
            storage.set(action, 'avatar', newUserAva);
            $.post(
                '/users/update',
                storage.getData(action),
                (res) => {
                    if (res.message) {
                        console.error(res);
                    } else {
                        storage.add(res.id, res);
                        $(`#ac-user-${res.id}`).html(res.name);                
                        $(`#ac-user-ava-${res.id}`).attr('src', res.avatar);                
                    }
    
                    preloader.visible(false);
                    $('#newUser').modal('hide');
                }
            );
        }
        
    }
}




