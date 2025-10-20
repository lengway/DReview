document.addEventListener('keydown', function(event) {

  const currentElement = document.activeElement;
  let nextElement;

  if (event.key === 'ArrowRight') {
    nextElement = currentElement.nextElementSibling;
    if (nextElement) {
      nextElement.focus();
      event.preventDefault();
    }
  } else if (event.key === 'ArrowLeft') {
    nextElement = currentElement.previousElementSibling;
    if (nextElement) {
      nextElement.focus();
      event.preventDefault();
    }
  }
});
