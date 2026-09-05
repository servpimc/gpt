const dropdown = document.getElementById('modelSelect');
const trigger = dropdown.querySelector('#model-trigger');
const selectedText = dropdown.querySelector('#model');

function getInput(){
    const input = {
            text: document.getElementById('user-input'),
            fileInput: document.getElementById("fileInput"),
            fileDrawer: document.getElementById('file-drawer'),
            fileList: document.getElementById('file-list'),
            chatContainer: document.getElementById('chat-container'),
            currentModel: document.getElementById('model-select')
    };
    return input;
}

const toggleDrawer = (open = dropdown.classList.toggle('open')) => {
  trigger.setAttribute('aria-expanded', open);
};

dropdown.addEventListener('click', (e) => {
    const input = getInput();
  const option = e.target.closest('.option-item');
  if (!option) return;

  input.currentModel.value = option.dataset.value;
  selectedText.textContent = option.querySelector('.option-title').textContent;

  dropdown.querySelector('.option-item.active')?.classList.remove('active');
  option.classList.add('active');
  toggleDrawer();
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target) && dropdown.classList.contains('open')) toggleDrawer();
});