"use strict"
let todoList = [];

let filterInput = document.getElementById("inputSearch");
let dateFrom = document.getElementById("dateFrom");
let dateTo = document.getElementById("dateTo");
let todoListDiv = document.getElementById("table");

function updateTodoList() {
    while (todoListDiv.children.length > 1) {
        todoListDiv.removeChild(todoListDiv.lastChild);
    }

    const filteredTodoList = todoList.filter((todo) => {
        const minDate = dateFrom.value || "0001-01-01";
        const maxDate = dateTo.value || "9999-12-31";
        const due = todo.dueDate || "0001-01-01";

        const keyword = filterInput.value.toLowerCase();
        const matchesText = todo.title.toLowerCase().includes(keyword) || todo.description.toLowerCase().includes(keyword) || todo.category.toLowerCase().includes(keyword) || todo.place.toLowerCase().includes(keyword);

        const matchesDate = due >= minDate && due <= maxDate;
        return matchesText && matchesDate;
    });

    filteredTodoList.forEach((todo, index) => {
        const newElement = document.createElement("tr");

        const title = document.createElement("td");
        title.innerText = todo.title;

        const description = document.createElement("td");
        description.innerText = todo.description;

        const place = document.createElement("td");
        place.innerText = todo.place;

        const category = document.createElement("td");
        category.innerText = todo.category;

        const dueDate = document.createElement("td");
        dueDate.innerText = dayjs(todo.dueDate).format("DD.MM.YYYY");

        const deleteBtn = document.createElement("td");
        const newDeleteButton = document.createElement("input");
        newDeleteButton.type = "button";
        newDeleteButton.value = "Delete";
        newDeleteButton.className = "btn btn-danger width-100";
        newDeleteButton.addEventListener("click", () => {
            deleteTodo(index);
        });
        deleteBtn.appendChild(newDeleteButton);

        newElement.append(title, description, place, category, dueDate, deleteBtn);
        todoListDiv.appendChild(newElement);
    });
}

filterInput.addEventListener("input", updateTodoList);
dateFrom.addEventListener("input", updateTodoList);
dateTo.addEventListener("input", updateTodoList);

let initList = function () {

    if (!('MASTER_KEY' in localStorage) || !('BIN_ID' in localStorage) || !("GROQ_KEY" in localStorage)) {
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

let addTodo = async function () {
    let inputTitle = document.getElementById("inputTitle");
    let inputDescription = document.getElementById("inputDescription");
    let inputPlace = document.getElementById("inputPlace");
    let inputDate = document.getElementById("inputDate");

    let newTitle = inputTitle.value;
    let newDescription = inputDescription.value;
    let newPlace = inputPlace.value;
    let newDate = inputDate.value;

    let newTodo = {
        title: newTitle,
        description: newDescription,
        place: newPlace,
        category: "undefined",
        dueDate: newDate
    };

    newTodo.category = await getCategoryFromGrok(newTodo);

    todoList.push(newTodo);
    console.log(newTodo);

    inputTitle.value = "";
    inputDescription.value = "";
    inputPlace.value = "";
    inputDate.value = "";
    updateJSONBin();
    updateTodoList();
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
    const groq_key = document.getElementById("groq-key");
    localStorage.setItem("MASTER_KEY", master_key.value);
    localStorage.setItem("BIN_ID", bin_id.value);
    localStorage.setItem("GROQ_KEY", groq_key.value);
    initList();
}

let getCategoryFromGrok = async (todoEntry) => {
    const body = {
        model: "openai/gpt-oss-20b", messages: [{
            role: "user", content: `
                    You are a task classification assistant.

                    Your goal is to assign a single category to the provided task based on its context.

                    Categories:
                    - university — tasks related to studies, lectures, exams, or academic projects.
                    - work — professional or job-related tasks, programming, meetings, or company projects.
                    - personal — private or everyday tasks, hobbies, errands, or family matters.
                    - finance — anything involving money, budgets, payments, taxes, or expenses.

                    Input:
                    - Task Title: ${todoEntry.title}
                    - Task Description: ${todoEntry.description}
                    - Task Place: ${todoEntry.place}

                    Output:
                    Return only the category name (university, work, personal, or finance) — no explanation or extra text.
                `.trim()
        }]
    }

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST", headers: {
                "Authorization": `Bearer ${localStorage.getItem("GROQ_KEY")}`,
                "Content-Type": "application/json"
            }, body: JSON.stringify(body)
        });

        const data = await res.json();
        return data.choices[0].message.content;
    } catch (err) {
        console.error(err);
        return "undefined";
    }
}