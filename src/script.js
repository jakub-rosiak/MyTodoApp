"use strict"
let todoList = [];

let filterInput = document.getElementById("inputSearch");
filterInput.addEventListener("input", () => { updateTodoList() })

let updateTodoList = function () {
    let todoListDiv =
        document.getElementById("table");


    while (todoListDiv.children.length > 1) {
        todoListDiv.removeChild(todoListDiv.lastChild);
    }

    for (let todo in todoList) {
        if (
            (!filterInput || filterInput.value === "") ||
            (todoList[todo].title.includes(filterInput.value)) ||
            (todoList[todo].description.includes(filterInput.value)) ||
            (todoList[todo].place.includes(filterInput.value))
        ) {
            let newElement = document.createElement("tr");
            let title = document.createElement("td");
            title.innerText = todoList[todo].title;
            let description = document.createElement("td");
            description.innerText = todoList[todo].description;
            let place = document.createElement("td");
            place.innerText = todoList[todo].place;
            let dueDate = document.createElement("td");
            dueDate.innerText = dayjs(todoList[todo].dueDate).format('DD.MM.YYYY');
            let deleteBtn = document.createElement("td");
            let newDeleteButton = document.createElement("input");
            newDeleteButton.type = "button";
            newDeleteButton.value = "❌";
            newDeleteButton.className = "btn btn-danger";
            newDeleteButton.addEventListener("click",
                function () {
                    deleteTodo(todo);
                });
            deleteBtn.appendChild(newDeleteButton);
            newElement.appendChild(title);
            newElement.appendChild(description);
            newElement.appendChild(place);
            newElement.appendChild(dueDate);
            newElement.appendChild(deleteBtn);

            todoListDiv.appendChild(newElement);
        }

    }
}

let initList = function () {

    if(!('MASTER_KEY' in localStorage) && !('BIN_ID' in localStorage)) {
        $("#settingsModal").modal("toggle");
    }

    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
            todoList = JSON.parse(req.responseText).record;
        }
        updateTodoList();
    };

    req.open("GET", `https://api.jsonbin.io/v3/b/${localStorage.getItem("BIN_ID")}/latest`, true);
    req.setRequestHeader("X-Master-Key", localStorage.getItem("MASTER_KEY"));
    req.send();
}

initList();

let deleteTodo = function (index) {
    todoList.splice(index, 1);
    updateTodoList();
    updateJSONBin();
}

let addTodo = function () {
    //get the elements in the form
    let inputTitle = document.getElementById("inputTitle");
    let inputDescription = document.getElementById("inputDescription");
    let inputPlace = document.getElementById("inputPlace");
    let inputDate = document.getElementById("inputDate");
    //get the values from the form
    let newTitle = inputTitle.value;
    let newDescription = inputDescription.value;
    let newPlace = inputPlace.value;
    let newDate = new Date(inputDate.value);
    //create new item
    let newTodo = {
        title: newTitle,
        description: newDescription,
        place: newPlace,
        category: '',
        dueDate: newDate
    };
    //add item to the list
    todoList.push(newTodo);

    // inputTitle.value = "";
    // inputDescription.value = "";
    // inputPlace.value = "";
    // inputDate.value = "";
    updateTodoList();
    updateJSONBin();
}

let updateJSONBin = () => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
            console.log(req.responseText);
        }
    };

    req.open("PUT", `https://api.jsonbin.io/v3/b/${localStorage.getItem("BIN_ID")}`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("X-Master-Key", localStorage.getItem("MASTER_KEY"));
    req.send(JSON.stringify(todoList));
}

let updateAPI = () => {
    const master_key = document.getElementById("master-key");
    const bin_id = document.getElementById("bin-id");
    localStorage.setItem("MASTER_KEY", master_key.value);
    localStorage.setItem("BIN_ID", bin_id.value);    
    initList();
}