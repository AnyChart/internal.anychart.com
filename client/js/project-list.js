const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const storage = new ListStorage();
const projectsContainer = $('#current_projects');

function addProject(project) {
    return $(`<div class="card" style="width: 16rem; float: left; margin:10px" id="project-info-${project.id}">
                <div class="card-body">
                    <h5>${project.name}</h5>
                    <a class="btn btn-success" href="/projects/${project.id}" id="ac-project-${project.id}">Choose</a>
                    <a class="btn btn-primary manager-controls" href="#" id="ac-edit-project-${project.id}"  data-toggle="modal" data-target="#newProject" data-action="${project.id}">Edit</a>
                    <!-- a href="#" data-id="${project.id}" onclick="remove(this)">Remove</a -->
                </div>
            </div>`);
}

function remove(target) {
    const id = $(target).attr('data-id');
    const name = storage.get(id, 'name');

    if (confirm(`Do you want to remove project "${name}"?`)) {
        preloader.visible(true);
        storage.set(id, 'deleted', 1);
        $.post(
            '/projects/update',
            storage.getData(id),
            (res) => {
                if (res.message) {
                    console.error(res);
                } else {
                    storage.del(id);
                    $(`#project-info-${id}`).remove();
                }

                preloader.visible(false);
            }
        );
    }
}

anychart.onDocumentReady(() => {
    initModalListeners();
    fetch('/projects')
        .then(resp => resp.json())
        .then(projects => {
            if (projects.message)
                return Promise.reject(projects);

            if (projects.length) {
                projectsContainer.html('');
                projects.forEach(project => {
                    storage.add(project.id, project);
                    projectsContainer.append(addProject(project));
                });
            } else {
                projectsContainer.html('No projects exist.');
            }
            preloader.visible(false);
            $('#newProject').modal('hide');
        })
        .catch((err) => {
            if (err) {
                console.log(err);
                projectsContainer.html(err.message ? err.message : 'Unknown error on loading data.');
            } else {
                projectsContainer.html('Could not fetch projects data.');
            }
            preloader.visible(false);
            $('#newProject').modal('hide');
        })
        .then((res, req)=>{
            fetch('/curr-user')
            .then(resp=>resp.json())
            .then(user=>{
                if ((!user.isAdmin)) $('.manager-controls').remove();
                $('#user-profile > img')
                    .attr('src', user.picture)
                    .attr('alt', user.name)
                    .attr('title', user.name);
            })
        });
});

function initModalListeners() {
    $('#newProject').on('show.bs.modal', function (event) {
        const target = $(event.relatedTarget) // Button that triggered the modal
        const action = target.attr('data-action');
        const name = storage.get(action, 'name');
        const modal = $(this);
        modal.attr('data-action', action);
        $('#new_project_name').val(name ? name : '');
    })
}


function createNewProject() {
    /*
        Parsing modal window data-attributes.
    */
    const modal = $('#newProject');
    const action = modal.attr('data-action');
    const newProjectName = $('#new_project_name').val();

    if (newProjectName) {
        preloader.visible(true);

        if (action == 'empty' || action == 'dummy') {
            $.post(
                '/projects/add',
                {
                    "name": newProjectName,
                    "action": action
                },
                (res) => {
                    if (res.message) {
                        console.error(res);
                    } else {
                        if (action == 'empty' || action == 'dummy') {
                            projectsContainer.prepend(addProject(res));
                        } else {
                            storage.set(action, 'name', newProjectName);
                            $(`#ac-project-${action}`).html(newProjectName);
                        }
                    }

                    preloader.visible(false);
                    $('#newProject').modal('hide');
                }
            );
        } else {
            storage.set(action, 'name', newProjectName);
            $.post(
                '/projects/update',
                storage.getData(action),
                (res) => {
                    if (res.message) {
                        console.error(res);
                    } else {
                        storage.add(res.id, res);
                        $(`#ac-project-${action}`).html(newProjectName);
                    }

                    preloader.visible(false);
                    $('#newProject').modal('hide');
                }
            );

        }

    }
}

function prepareDummyData() {
    preloader.visible(true);
    fetch('/tasks/roots')
        .then(resp => resp.json())
        .then(roots => {
            const modal = $('#newDummyProject');
            const checkboxes = $(modal.find('#dummyNames')[0]);
            checkboxes.empty();
            roots.forEach(r => {
                checkboxes.append(createDummyCheckBox_(r));
            });
            preloader.visible(false);
            modal.modal('show')
        })
        .catch(e => {
            preloader.visible(false);
            console.log(e)
        });
}

function createDummyCheckBox_(data) {
    return $(`<div class="form-check">
                <label class="form-check-label">
                    <input type="checkbox" class="form-check-input" value="${data.name}">${data.name}
                </label>
              </div>`);

}

function createNewDummyProject() {
    const modal = $('#newDummyProject');

    const action = modal.attr('data-action');
    const newProjectName = $('#new_dummy_project_name').val();

    if (newProjectName) {
        const checkboxes = $(modal.find('#dummyNames')[0]);
        const checked = checkboxes.find('.form-check-input:checkbox:checked');
        const names = [];
        checked.each(function () { //TODO Strange code, needs to be refactored.
            names.push($(this).val());
        });

        fetch('/projects/add', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newProjectName,
                action: action,
                tasks: names
            })
        })
        .then(resp => resp.json())
        .then(project => {
            storage.add(project.id, project);
            projectsContainer.prepend(addProject(project));
            modal.modal('hide');
        }).catch(e => {
            modal.modal('hide');
            console.log(e);
        });
    }

}