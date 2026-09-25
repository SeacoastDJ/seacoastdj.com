document.querySelectorAll('.copy-button').forEach(button => button.addEventListener('click', async () => {
  const text = button.closest('form').querySelector('textarea').value;
  await navigator.clipboard.writeText(text); const original = button.textContent; button.textContent = 'Copied';
  setTimeout(() => { button.textContent = original; }, 1200);
}));
