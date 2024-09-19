import { getTasks, createNewTask, patchTask, deleteTask } from './utils/taskFunctions.js';
import { initialData } from './initialData.js';

// Initialize data in local storage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData));
    localStorage.setItem('showSideBar', 'true');
    localStorage.setItem('light-theme', 'disabled');
  } else {
    console.log('Data already exists in localStorage');
  }
}

// Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById('header-board-name'),
  columnDivs: document.querySelectorAll('.column-div'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  themeSwitch: document.getElementById('theme-switch'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  modalWindow: document.getElementById('new-task-modal-window'),
  editTaskModal: document.getElementById('edit-task-modal-window'),
  filterDiv: document.getElementById('filter-div'),
};

// Set global variables
let activeBoard = "";

// Initialize and fetch data
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Display boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = '';
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filter and display tasks by board
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.classList.add('tasks-container');
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);
      taskElement.addEventListener('click', () => openEditTaskModal(task));
      tasksContainer.appendChild(taskElement);
    });
  });
}

// Refresh tasks UI
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Style the active board
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Add task to UI
function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
  taskElement.setAttribute('data-task-id', task.id);
  taskElement.addEventListener('click', () => openEditTaskModal(task));
  
  tasksContainer.appendChild(taskElement);
}

// Open edit task modal
function openEditTaskModal(task) {
  document.getElementById('edit-task-title-input').value = task.title;
  document.getElementById('edit-task-status-select').value = task.status;
  
  const saveChangesBtn = document.getElementById('save-task-changes-btn');
  saveChangesBtn.onclick = () => saveTaskChanges(task.id);

  const deleteTaskBtn = document.getElementById('delete-task-btn');
  deleteTaskBtn.onclick = () => deleteTaskFromModal(task.id);

  toggleModal(true, elements.editTaskModal);
}

// Save task changes
function saveTaskChanges(taskId) {
  const updatedTask = {
    title: document.getElementById('edit-task-title-input').value,
    status: document.getElementById('edit-task-status-select').value,
  };

  patchTask(taskId, updatedTask);

  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

// Delete task from edit modal
function deleteTaskFromModal(taskId) {
  deleteTask(taskId);
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

// Toggle modal visibility
function toggleModal(show, modalElement = elements.modalWindow) {
  modalElement.style.display = show ? 'block' : 'none';
}

// Add new task
function addTask(event) {
  event.preventDefault();

  const task = {
    title: document.getElementById('task-title-input').value,
    board: activeBoard,
    status: 'todo',
    status: 'doing',
    status: 'done',
    id: new Date().getTime()
  };

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
    event.target.reset();
    refreshTasksUI();
  }
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLightTheme = document.body.classList.contains('light-theme');
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
}

// Toggle sidebar visibility
function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');
  sidebar.style.display = show ? 'block' : 'none';
  localStorage.setItem('showSideBar', show ? 'true' : 'false');
}

// Setup event listeners
function setupEventListeners() {
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  elements.createNewTaskBtn.addEventListener('click', () => toggleModal(true, elements.modalWindow));

  const addTaskForm = document.getElementById('new-task-modal-window');
  addTaskForm.addEventListener('submit', addTask);

  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));
  elements.themeSwitch.addEventListener('click', () => toggleTheme());
}

// Initialize the application
initializeData();
fetchAndDisplayBoardsAndTasks();
setupEventListeners();
// toggleTheme();
// toggleSidebar();

// Apply saved theme
if (localStorage.getItem('light-theme') === 'enabled') {
  document.body.classList.add('light-theme');
}
