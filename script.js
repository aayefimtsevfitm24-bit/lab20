const BASE_URL = 'https://todo-lab20-de002-default-rtdb.europe-west1.firebasedatabase.app/'.replace(/\/+$/, '');

const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');

let todos = [];

// --- Завдання 6: Умовний рендеринг (завантаження та помилки) ---
function setLoading(isLoading) {
  if (isLoading) {
    loadingEl.classList.remove('d-none');
    loadingEl.classList.add('d-flex');
  } else {
    loadingEl.classList.remove('d-flex');
    loadingEl.classList.add('d-none');
  }
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('d-none');
}

function clearError() {
  errorEl.textContent = '';
  errorEl.classList.add('d-none');
}

// --- Відображення списку та лічильників ---
function renderTodo(todo) {
  return `
    <li class="list-group-item">
      <input
        type="checkbox"
        class="form-check-input me-2"
        id="${todo.id}"
        ${todo.checked ? 'checked' : ''}
        onchange="checkTodo('${todo.id}')"
      />
      <label for="${todo.id}">
        <span class="${todo.checked ? 'text-success text-decoration-line-through' : ''}">
          ${todo.text}
        </span>
      </label>
      <button class="btn btn-danger btn-sm float-end" onclick="deleteTodo('${todo.id}')">
        delete
      </button>
    </li>
  `;
}

function render(todosArray = todos) {
  list.innerHTML = todosArray.map((todo) => renderTodo(todo)).join('');
}

function updateCounter() {
  itemCountSpan.textContent = todos.length;
  const uncheckedCount = todos.filter((todo) => !todo.checked).length;
  uncheckedCountSpan.textContent = uncheckedCount;
}

// --- Завдання 3: Читання з БД (GET) ---
function fetchTodos() {
  setLoading(true);
  clearError();

  fetch(`${BASE_URL}/todos.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Помилка завантаження даних (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data) {
        todos = [];
      } else {
        todos = Object.entries(data).map(([id, item]) => ({
          id,
          text: item.text,
          checked: Boolean(item.checked),
        }));
      }
      render(todos);
      updateCounter();
    })
    .catch((error) => {
      console.error(error);
      showError(`Не вдалося завантажити справи: ${error.message}`);
    })
    .finally(() => {
      setLoading(false);
    });
}

// --- Завдання 2: Додавання даних у БД (POST) ---
function addTodo(todo) {
  setLoading(true);
  clearError();

  return fetch(`${BASE_URL}/todos.json`, {
    method: 'POST',
    body: JSON.stringify(todo),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Помилка додавання справи (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      // Firebase повертає { name: "-N..." } — використовуємо name як id
      const createdTodo = { id: data.name, ...todo };
      todos.push(createdTodo);
      render(todos);
      updateCounter();
    })
    .catch((error) => {
      console.error(error);
      showError(`Не вдалося додати справу: ${error.message}`);
    })
    .finally(() => {
      setLoading(false);
    });
}

function newTodo() {
  const text = prompt('Введіть нову справу:');
  if (!text || !text.trim()) {
    return;
  }

  // Передаємо об'єкт без id, як вимагає завдання
  addTodo({
    text: text.trim(),
    checked: false,
  });
}

// --- Завдання 4: Видалення даних з БД (DELETE) ---
function deleteTodo(id) {
  setLoading(true);
  clearError();

  fetch(`${BASE_URL}/todos/${id}.json`, {
    method: 'DELETE',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Помилка видалення справи (${response.status})`);
      }
      todos = todos.filter((todo) => todo.id !== id);
      render(todos);
      updateCounter();
    })
    .catch((error) => {
      console.error(error);
      showError(`Не вдалося видалити справу: ${error.message}`);
    })
    .finally(() => {
      setLoading(false);
    });
}

// --- Завдання 5: Оновлення даних в БД (PATCH) ---
function checkTodo(id) {
  const target = todos.find((todo) => todo.id === id);
  if (!target) return;

  const updatedChecked = !target.checked;
  setLoading(true);
  clearError();

  fetch(`${BASE_URL}/todos/${id}.json`, {
    method: 'PATCH',
    body: JSON.stringify({ checked: updatedChecked }),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Помилка оновлення справи (${response.status})`);
      }
      todos = todos.map((todo) =>
        todo.id === id ? { ...todo, checked: updatedChecked } : todo
      );
      render(todos);
      updateCounter();
    })
    .catch((error) => {
      console.error(error);
      showError(`Не вдалося оновити статус справи: ${error.message}`);
      render(todos); // Повертаємо чекбокс у попередній стан при помилці
    })
    .finally(() => {
      setLoading(false);
    });
}

// Початкове завантаження справ із Firebase
fetchTodos();