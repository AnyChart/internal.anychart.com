const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const storage = new ListStorage();
const projectsContainer = $('#current_projects');

function addProject(project) {
    return $(`<div class="media text-muted pt-3" id="project-info-${project.id}">
                        <div class="media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                            <div class="d-flex justify-content-between align-items-center w-100">
                                <strong class="text-gray-dark">
                                    <a href="/projects/${project.id}" id="ac-project-${project.id}">${project.name}</a> (<a id="ac-edit-project-${project.id}" href="#" data-toggle="modal" data-target="#newProject" data-action="${project.id}">Edit</a>)
                                </strong>
                                <a href="#" data-id="${project.id}" onclick="remove(this)">Remove</a>
                            </div>
                            <span class="d-block">${anychart.format.dateTime(project.last_modified)}</span>
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