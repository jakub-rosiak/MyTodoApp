"use strict"
let todoList = []; //declares a new array for Your todo list

let updateTodoList = function () {
    let todoListDiv =
        document.getElementById("table");

    //remove all elements
    while (todoListDiv.firstChild) {
        todoListDiv.removeChild(todoListDiv.firstChild);
    }

    //add all elements
    let filterInput = document.getElementById("inputSearch");
    // for (let todo in todoList) {
    //     if (
    //         (filterInput.value == "") ||
    //         (todoList[todo].title.includes(filterInput.value)) ||
    //         (todoList[todo].description.includes(filterInput.value))
    //     ) {
    //         let newElement = document.createElement("p");
    //         let newContent = document.createTextNode(todoList[todo].title + " " +
    //             todoList[todo].description);
    //         newElement.appendChild(newContent);
    //         todoListDiv.appendChild(newElement);
    //         let newDeleteButton = document.createElement("input");
    //         newDeleteButton.type = "button";
    //         newDeleteButton.value = "x";
    //         newDeleteButton.addEventListener("click",
    //             function () {
    //                 deleteTodo(todo);
    //             });

    //         newElement.appendChild(newDeleteButton);
    //     }
    // }

    for (let todo in todolist) {
        if (
            (filterInput.value = "") ||
            (todoList[todo].title.includes(filterInput.value)) ||
            (todoList[todo].description.includes(filterInput.value))
        ) {
            let newElement = document.createElement("tr");
            let title = document.createElement("td");
            title.innerText = todoList[todo].title;
            let description = document.createElement("td");
            description.innerText = todoList[todo].description;
            let place = document.createElement("td");
            place.innerText = todoList[todo].place;
            let dueDate = document.createElement("td");
            dueDate.innerText = todoList[todo].dueDate;
            let deleteBtn = document.createElement("td");
            let newDeleteButton = document.createElement("input");
            newDeleteButton.type = "button";
            newDeleteButton.value = "x";
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
        }
    }
}

let initList = function () {

    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
            todoList = JSON.parse(req.responseText).record;
        }
        updateTodoList();
    };

    req.open("GET", "https://api.jsonbin.io/v3/b/68f2259eae596e708f189282/latest", true);
    req.setRequestHeader("X-Master-Key", "");
    req.send();

    // let savedList = window.localStorage.getItem("todos");
    // if (savedList != null)
    //     todoList = JSON.parse(savedList);
    // else
    //     todoList.push(
    //         {
    //             title: "Learn JS",
    //             description: "Create a demo application for my TODO's",
    //             place: "445",
    //             category: '',
    //             dueDate: new Date(2024, 10, 16)
    //         },
    //         {
    //             title: "Lecture test",
    //             description: "Quick test from the first three lectures",
    //             place: "F6",
    //             category: '',
    //             dueDate: new Date(2024, 10, 17)
    //         }
    //         // of course the lecture test mentioned above will not take place
    //     );
}

initList();



//setInterval(updateTodoList, 1000);

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

    window.localStorage.setItem("todos", JSON.stringify(todoList));
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

    req.open("PUT", "https://api.jsonbin.io/v3/b/68f2259eae596e708f189282", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("X-Master-Key", "");
    req.send(JSON.stringify(todoList));
}